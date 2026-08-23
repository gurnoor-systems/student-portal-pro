import { NextRequest, NextResponse } from "next/server";
import { TieredFlashcardsResult } from "@/lib/types";

/**
 * Deterministic Fallback Generator
 * Analyzes text structure, definitions, key relationships, and deep principles
 */
function heuristicFlashcardsGenerator(text: string, courseCode: string, documentTitle?: string): TieredFlashcardsResult {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 25);

  const easy: Array<{ question: string; answer: string }> = [];
  const medium: Array<{ question: string; answer: string }> = [];
  const hard: Array<{ question: string; answer: string }> = [];

  // Extract direct definitions (is defined as, refers to, denotes, means, is a)
  paragraphs.forEach(p => {
    // 1. Definition / Fact Match (Easy)
    const defMatch = p.match(/([A-Z][a-zA-Z\s]{2,35})\s+(?:is defined as|refers to|is a mechanism|is a|denotes|is an?)\s+([^.!?]+[.!?])/i);
    if (defMatch && easy.length < 5) {
      const term = defMatch[1].trim();
      const explanation = defMatch[2].trim();
      easy.push({
        question: `What is the definition and core purpose of ${term}?`,
        answer: `${term} is ${explanation.replace(/^[a-z]/, c => c.toLowerCase())}`
      });
    }

    // 2. Comparison / Relationship / Conceptual Mechanism (Medium)
    const relMatch = p.match(/(?:unlike|compared to|difference between|in contrast to|whereas|leads to|results in|depends on)\s+([^.!?]+[.!?])/i);
    if (relMatch && medium.length < 5) {
      medium.push({
        question: `How do key concepts interact or differentiate within this context: "${p.slice(0, 60)}..."?`,
        answer: p.slice(0, 220)
      });
    }

    // 3. High-Order Synthesis / Architecture / Critical Evaluation (Hard)
    const complexMatch = p.match(/(?:trade-off|consequence|optimization|bottleneck|algorithmic|implication|vulnerability|underlying reason)\s+([^.!?]+[.!?])/i);
    if (complexMatch && hard.length < 5) {
      hard.push({
        question: `Analyze the critical trade-offs, constraints, or systematic implications discussed in: "${p.slice(0, 60)}..."`,
        answer: p.slice(0, 260)
      });
    }
  });

  // Ensure minimum comprehensive flashcards for great study experience
  if (easy.length === 0) {
    easy.push(
      {
        question: `What is the primary subject matter and foundational definition of ${courseCode}?`,
        answer: `Covers foundational principles, architectural frameworks, and core terminology outlined in ${documentTitle || "the study material"}.`
      },
      {
        question: `What are the direct terms and core metrics introduced in this module?`,
        answer: `Direct definitions include primary operational components, baseline units, and procedural steps established in the text.`
      }
    );
  }

  if (medium.length === 0) {
    medium.push(
      {
        question: `How do the core algorithms or system mechanisms in ${courseCode} cooperate to solve key bottlenecks?`,
        answer: `They balance resource constraints, minimize latency/overhead, and synchronize interdependent operations across modules.`
      },
      {
        question: `What is the relationship between the inputs, transformations, and outputs described in this text?`,
        answer: `Inputs undergo structured state transitions and validation stages to guarantee system correctness and determinism.`
      }
    );
  }

  if (hard.length === 0) {
    hard.push(
      {
        question: `Critically evaluate the architectural trade-offs between performance, scalability, and complexity in this topic.`,
        answer: `Optimizing for peak speed or throughput typically introduces synchronization overhead, memory footprint pressure, or edge-case failure modes requiring robust mitigation.`
      },
      {
        question: `How would you synthesize these principles to design a solution under severe edge-case or failure conditions?`,
        answer: `Apply modular isolation, defensive error recovery mechanisms, and invariant verification to preserve integrity during anomalies.`
      }
    );
  }

  return {
    courseCode,
    documentTitle,
    easy,
    medium,
    hard,
    totalCount: easy.length + medium.length + hard.length
  };
}

export async function POST(req: NextRequest) {
  try {
    const { text, courseCode = "COURSE-101", documentTitle } = await req.json();

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json({ error: "No document text provided for flashcard generation." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Execute with Gemini 1.5 Flash structured output
    if (apiKey) {
      try {
        const systemPrompt = `Act as an expert university professor and instructional designer. Analyze the attached document and create a comprehensive set of flashcards based solely on the provided text. Do not use any outside knowledge. Format each flashcard clearly with a Question (Q) and an Answer (A). Classify every flashcard into one of three strict difficulty levels: Easy (basic definitions, direct facts), Medium (conceptual understanding, relationships), or Hard (complex analysis, application, synthesis). Organize the output cleanly into three distinct sections: Easy Flashcards, Medium Flashcards, and Hard Flashcards. Ensure questions test deep university-level comprehension rather than trivial word matching.

Course Code: ${courseCode}
Document: ${documentTitle || "Study Material"}

Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "courseCode": "${courseCode}",
  "documentTitle": "${documentTitle || "Study Material"}",
  "easy": [
    { "question": "Question text...", "answer": "Clear, precise answer..." }
  ],
  "medium": [
    { "question": "Conceptual relationship question...", "answer": "Detailed explanation..." }
  ],
  "hard": [
    { "question": "Analytical / synthesis problem...", "answer": "Deep structural response..." }
  ]
}

Document Text:
${text.slice(0, 15000)}
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.2
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            const easyCards = Array.isArray(parsed.easy) ? parsed.easy : [];
            const mediumCards = Array.isArray(parsed.medium) ? parsed.medium : [];
            const hardCards = Array.isArray(parsed.hard) ? parsed.hard : [];

            return NextResponse.json({
              success: true,
              result: {
                courseCode: parsed.courseCode || courseCode,
                documentTitle: parsed.documentTitle || documentTitle,
                easy: easyCards,
                medium: mediumCards,
                hard: hardCards,
                totalCount: easyCards.length + mediumCards.length + hardCards.length
              },
              source: "gemini"
            });
          }
        }
      } catch (aiErr) {
        console.warn("AI flashcard generation failed, utilizing heuristic analyzer fallback:", aiErr);
      }
    }

    // Heuristic Analyzer Fallback
    const fallbackResult = heuristicFlashcardsGenerator(text, courseCode, documentTitle);
    return NextResponse.json({
      success: true,
      result: fallbackResult,
      source: "heuristic"
    });

  } catch (err: any) {
    console.error("Flashcard generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate flashcards." },
      { status: 500 }
    );
  }
}
