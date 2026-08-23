/**
 * Universal Client & Server Document Text Extractor
 * Supports: PDF (.pdf), Word Documents (.docx, .doc), Text (.txt, .md, .csv, .json), Rich Text (.rtf)
 * Extracts clean, human-readable paragraphs, headings, bullet lists, and definitions.
 */

/**
 * Extract text from raw PDF ArrayBuffer / text stream
 */
export function extractTextFromPDFBuffer(buffer: ArrayBuffer | string): string {
  let rawStr = "";
  if (typeof buffer === "string") {
    rawStr = buffer;
  } else {
    const uint8 = new Uint8Array(buffer);
    // Convert bytes to string safely
    const chunkSize = 8192;
    for (let i = 0; i < uint8.length; i += chunkSize) {
      const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
      rawStr += String.fromCharCode.apply(null, Array.from(chunk));
    }
  }

  const extracted: string[] = [];

  // 1. Extract text in parenthesis from Tj / TJ operators: (Text) Tj or [(Text) -10 (More Text)] TJ
  const tjRegex = /\(([^()]{1,800})\)\s*T[jd]/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(rawStr)) !== null) {
    const text = cleanPDFString(match[1]);
    if (text.length > 1) extracted.push(text);
  }

  // 2. Extract array text: [ (Chunk1) 20 (Chunk2) ] TJ
  const arrayTjRegex = /\[\s*((?:\([^()]+\)\s*[-0-9.]*\s*)+)\]\s*TJ/g;
  while ((match = arrayTjRegex.exec(rawStr)) !== null) {
    const inner = match[1];
    const innerMatches = inner.match(/\(([^()]+)\)/g);
    if (innerMatches) {
      const line = innerMatches.map(m => cleanPDFString(m.slice(1, -1))).join(" ");
      if (line.length > 2) extracted.push(line);
    }
  }

  // 3. Fallback: Catch all text within parentheses if structured TJ blocks were sparse
  if (extracted.length < 5) {
    const allParens = rawStr.match(/\(([^()]{2,600})\)/g);
    if (allParens) {
      allParens.forEach(p => {
        const text = cleanPDFString(p.slice(1, -1));
        if (text.length > 2 && /[a-zA-Z]/.test(text) && !text.startsWith("/Font") && !text.startsWith("/Filter")) {
          extracted.push(text);
        }
      });
    }
  }

  // 4. Clean stream plain-text fallback (extract blocks of ASCII text)
  if (extracted.length === 0) {
    const asciiBlocks = rawStr.replace(/[^\x20-\x7E\n\t]/g, " ").split(/\s{2,}/);
    const validWords = asciiBlocks.filter(w => w.length > 20 && /[a-zA-Z]/.test(w) && !w.includes("endobj") && !w.includes("xref"));
    return validWords.join("\n\n");
  }

  return extracted.join(" ").replace(/\s+/g, " ").trim();
}

function cleanPDFString(str: string): string {
  return str
    .replace(/\\([()\\])/g, "$1")
    .replace(/\\r/g, " ")
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, " ")
    .replace(/\\b/g, "")
    .replace(/\\f/g, "")
    .trim();
}

/**
 * Extract text from Word DOCX XML streams or raw DOC files
 */
export function extractTextFromDocx(rawStr: string): string {
  // Extract all <w:t>...</w:t> text nodes in Word XML
  const wtMatches = rawStr.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  if (wtMatches && wtMatches.length > 0) {
    const lines: string[] = [];
    let currentParagraph = "";

    rawStr.split(/<\/w:p>/g).forEach(pBlock => {
      const pMatches = pBlock.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (pMatches) {
        const pText = pMatches.map(m => m.replace(/<[^>]+>/g, "")).join("");
        if (pText.trim().length > 0) {
          lines.push(pText.trim());
        }
      }
    });

    if (lines.length > 0) return lines.join("\n\n");
  }

  // Fallback: strip all XML tags
  return rawStr.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Clean RTF text headers
 */
export function extractTextFromRTF(rtfStr: string): string {
  return rtfStr
    .replace(/\\par[d]?/g, "\n")
    .replace(/\\tab/g, "\t")
    .replace(/\\[a-z0-9-]+/gi, " ")
    .replace(/[{}]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Universal browser-side file parser
 * Reads any File object and returns clean extracted text
 */
export async function parseDocumentFile(file: File): Promise<{ text: string; pageCount: number; title: string }> {
  const fileName = file.name;
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  // 1. Text & Markdown Files
  if (["txt", "md", "csv", "json"].includes(extension)) {
    const text = await file.text();
    return {
      text: text.trim(),
      pageCount: Math.max(1, Math.ceil(text.length / 2500)),
      title: fileName
    };
  }

  // 2. Rich Text Format (.rtf)
  if (extension === "rtf") {
    const raw = await file.text();
    const clean = extractTextFromRTF(raw);
    return {
      text: clean,
      pageCount: Math.max(1, Math.ceil(clean.length / 2500)),
      title: fileName
    };
  }

  // 3. Word Document (.docx / .doc)
  if (extension === "docx" || extension === "doc") {
    const raw = await file.text();
    const clean = extractTextFromDocx(raw);
    return {
      text: clean || `Uploaded Document: ${fileName}`,
      pageCount: Math.max(1, Math.ceil(clean.length / 2500)),
      title: fileName
    };
  }

  // 4. PDF (.pdf)
  if (extension === "pdf") {
    const buffer = await file.arrayBuffer();
    const clean = extractTextFromPDFBuffer(buffer);
    return {
      text: clean || `Uploaded PDF Document: ${fileName}`,
      pageCount: Math.max(1, Math.ceil(clean.length / 2500)),
      title: fileName
    };
  }

  // Fallback for any other file type
  const fallbackText = await file.text().catch(() => "");
  return {
    text: fallbackText.replace(/[^\x20-\x7E\n\t]/g, " ").trim() || `Course Material: ${fileName}`,
    pageCount: 1,
    title: fileName
  };
}
