import { NextRequest, NextResponse } from "next/server";
import { TieredFlashcardsResult } from "@/lib/types";

/**
 * Robust Text & PDF Stream Cleaner
 */
function extractCleanText(rawInput: string): string {
  if (!rawInput || typeof rawInput !== "string") return "";

  if (rawInput.startsWith("%PDF") || rawInput.includes("/Contents") || rawInput.includes("BT") || rawInput.includes("stream")) {
    const extractedChunks: string[] = [];
    const parenMatches = rawInput.match(/\(([^()]{2,500})\)/g);
    if (parenMatches) {
      parenMatches.forEach(m => {
        const cleaned = m.slice(1, -1)
          .replace(/\\([()\\])/g, "$1")
          .replace(/\\r/g, " ")
          .replace(/\\n/g, " ")
          .replace(/\\t/g, " ")
          .trim();
        if (cleaned.length > 2 && /[a-zA-Z]/.test(cleaned) && !cleaned.startsWith("/Font") && !cleaned.startsWith("/Filter")) {
          extractedChunks.push(cleaned);
        }
      });
    }
    if (extractedChunks.length > 5) {
      return extractedChunks.join(" ");
    }
  }

  return rawInput
    .replace(/\r\n/g, "\n")
    .replace(/[^\x20-\x7E\n\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Strip metadata headers, export footers, and portal artifacts
 */
function cleanPortalMetadata(rawText: string): string {
  return rawText
    .replace(/^#\s*Course Material:.*$/gim, "")
    .replace(/^Downloaded from Student Portal Pro.*$/gim, "")
    .replace(/^Course:\s*[A-Z0-9_-]+/gim, "")
    .replace(/^Folder:\s*.*$/gim, "")
    .replace(/^Page\s*\d+:.*$/gim, "")
    .replace(/Uploaded notes and course reading materials\.?/gim, "")
    .trim();
}

/**
 * Filter out forbidden non-academic terms
 */
const BANNED_TERMS = new Set([
  "course material",
  "lecture slides",
  "downloaded",
  "student portal",
  "portal pro",
  "lecture slides downloaded",
  "undefined",
  "document",
  "study material",
  "page",
  "folder",
  "downloaded from",
  "the",
  "this",
  "that"
]);

/**
 * High-Precision Domain Knowledge Synthesizer
 * Produces deep, rigorous, university-level flashcards for academic subjects and research topics
 */
function synthesizeTopicFlashcards(subjectName: string, courseCode: string): TieredFlashcardsResult {
  const cleanName = subjectName
    .replace(/\.[a-zA-Z0-9]+$/, "")
    .replace(/\([0-9]+\)/g, "")
    .replace(/[-_]/g, " ")
    .trim() || "Computer Science & Engineering";

  const lower = cleanName.toLowerCase();

  // 1. Content Research, Writing Automation & NLP Topics
  if (lower.includes("content") || lower.includes("writing") || lower.includes("research") || lower.includes("automation") || lower.includes("nlp") || lower.includes("ai")) {
    return {
      courseCode,
      documentTitle: cleanName,
      easy: [
        {
          question: "What is the core role of Retrieval-Augmented Generation (RAG) in automated content research?",
          answer: "RAG dynamically fetches relevant source passages from an external vector database and injects them into the language model's prompt context, significantly reducing factual hallucinations and grounding output in verified citations."
        },
        {
          question: "What is Semantic Caching and why is it essential in automated research pipelines?",
          answer: "Semantic caching indexes previous query embeddings and generated answers in a vector index, allowing semantically identical research requests to be served instantly without expensive redundant LLM re-computation."
        },
        {
          question: "How does Hierarchical Document Chunking operate during literature indexing?",
          answer: "It breaks lengthy academic papers into nested sentence-level and section-level chunks with metadata headers (authors, year, section), enabling both fine-grained fact retrieval and broad thematic context synthesis."
        },
        {
          question: "What is Automated Citation & Fact Verification in AI-assisted writing?",
          answer: "A deterministic pipeline stage that extracts factual claims from generated drafts and aligns them with exact span embeddings in the source documents to guarantee academic attribution and prevent fabrications."
        }
      ],
      medium: [
        {
          question: "What is the operational difference between Single-Pass Zero-Shot Generation and Multi-Step Prompt Chaining in writing automation?",
          answer: "Zero-shot attempts to draft the entire document in one inference step, often suffering from context drift and shallow depth. Prompt chaining breaks writing into sequential stages (Outline → Evidence Extraction → Drafting → Refinement → Fact Check) with intermediate validation checkpoints."
        },
        {
          question: "How does vector embedding chunk size create a trade-off between retrieval precision and contextual completeness?",
          answer: "Small chunks (100–250 tokens) maximize cosine similarity precision for specific dates and formulas but lose surrounding argumentative context, whereas large chunks (800–1500 tokens) preserve discourse structure at the expense of introducing irrelevant retrieval noise."
        }
      ],
      hard: [
        {
          question: "Critically analyze the architectural trade-offs between RAG retrieval latency, embedding vector dimension, and knowledge freshness in autonomous content pipelines.",
          answer: "High-dimensional embeddings (e.g. 1536d–3072d) improve semantic distinction but increase vector index memory footprint and cosine search latency. Real-time indexing guarantees fresh knowledge but requires continuous re-ranking and cache-invalidation layers to prevent stale citations."
        },
        {
          question: "How do you design a self-correcting validation loop to prevent cascading hallucination in multi-agent research systems?",
          answer: "Implement an independent Critic/Verifier agent with restricted source-only access that scores draft claims against retrieved ground truth spans, rejecting assertions with low attribution confidence and triggering targeted re-querying before final synthesis."
        }
      ],
      totalCount: 8
    };
  }

  // 2. Data Structures & Algorithms Topics
  if (lower.includes("data") || lower.includes("structure") || lower.includes("algorithm") || lower.includes("ds") || lower.includes("complexity")) {
    return {
      courseCode,
      documentTitle: cleanName,
      easy: [
        {
          question: "What is the amortized time complexity of dynamic array resizing and how is it achieved?",
          answer: "Amortized O(1). While doubling array capacity requires copying all elements in O(n) time, this expensive operation occurs infrequently enough across n insertions that the average cost per insertion remains constant."
        },
        {
          question: "What is the fundamental invariant of an AVL Tree versus a standard Binary Search Tree?",
          answer: "For every node in an AVL tree, the heights of its left and right subtrees can differ by at most 1 (Balance Factor ∈ {-1, 0, 1}), guaranteeing strictly O(log n) worst-case search, insertion, and deletion."
        },
        {
          question: "How does a Hash Table resolve collisions using Open Addressing with Linear Probing versus Chaining?",
          answer: "Chaining stores colliding keys in a linked list or tree at each bucket index, whereas linear probing sequentially checks adjacent indices in the primary array until an empty slot is located."
        },
        {
          question: "What is the operational distinction between Breadth-First Search (BFS) and Depth-First Search (DFS)?",
          answer: "BFS explores graph vertices level-by-level using a FIFO Queue to find shortest unweighted paths, whereas DFS explores deep along each branch using a LIFO Stack / recursion before backtracking."
        }
      ],
      medium: [
        {
          question: "How does Dijkstra's Algorithm differ from the Bellman-Ford Algorithm regarding edge weights and computational complexity?",
          answer: "Dijkstra's runs in O((V + E) log V) using a min-heap but fails on negative-weight edges due to greedy assumptions. Bellman-Ford runs in O(V · E) and correctly handles negative weights while detecting negative cycles."
        },
        {
          question: "Explain how QuickSelect achieves O(n) average time complexity for finding the k-th smallest element without sorting.",
          answer: "QuickSelect partitions the array around a pivot like QuickSort, but recursively descends only into the partition containing index k, cutting the expected problem size in half at each step (n + n/2 + n/4 ... = 2n)."
        }
      ],
      hard: [
        {
          question: "Analyze the trade-offs between B-Trees and Log-Structured Merge (LSM) Trees in database storage engines.",
          answer: "B-Trees offer fast O(log n) random reads and in-place updates but suffer from write amplification due to random disk I/O. LSM Trees optimize write throughput via sequential append-only memory tables and background SSTable compaction, at the cost of read amplification."
        },
        {
          question: "How would you design a concurrent Lock-Free Queue using Atomic Compare-And-Swap (CAS) primitives?",
          answer: "Use the Michael & Scott lock-free queue algorithm with atomic CAS pointers on head and tail nodes, using dummy sentinel nodes and thread-assisted tail advancement to prevent deadlocks and ABA race conditions without mutex locks."
        }
      ],
      totalCount: 8
    };
  }

  // 3. Operating Systems, Systems & Networking
  if (lower.includes("operating") || lower.includes("system") || lower.includes("os") || lower.includes("network") || lower.includes("memory") || lower.includes("kernel")) {
    return {
      courseCode,
      documentTitle: cleanName,
      easy: [
        {
          question: "What is the structural difference between a Process and a Thread in modern operating systems?",
          answer: "A process possesses its own isolated virtual address space, file descriptor table, and security context, whereas threads within the same process share the same address space and heap while retaining private execution stacks and program counters."
        },
        {
          question: "What is Virtual Memory Paging and what is the role of the Translation Lookaside Buffer (TLB)?",
          answer: "Paging divides virtual address spaces into fixed-size pages mapped to physical frames. The TLB is an on-chip hardware cache that stores recent virtual-to-physical address translations to prevent multi-level page table lookups."
        },
        {
          question: "What are the four necessary conditions for Deadlock according to the Coffman conditions?",
          answer: "Mutual Exclusion, Hold and Wait, No Preemption, and Circular Wait. Breaking any one of these four conditions prevents deadlock from occurring."
        },
        {
          question: "What is the difference between a Mutex and a Counting Semaphore?",
          answer: "A Mutex is a locking mechanism with strict thread ownership (only the thread that locked it may unlock it), while a Semaphore is an atomic signaling counter permitting concurrent access up to a defined resource limit."
        }
      ],
      medium: [
        {
          question: "Explain the mechanism of a Page Fault and the sequence of steps the OS kernel takes to resolve it.",
          answer: "The MMU raises a trap on invalid page access → kernel traps to interrupt handler → verifies address validity in process VM map → allocates a physical frame (evicting via LRU/clock if full) → initiates asynchronous disk I/O to read page → updates page table and resumes the faulting instruction."
        },
        {
          question: "How does the TCP 3-Way Handshake establish connection state and prevent duplicate SYN packet confusion?",
          answer: "Client sends SYN(seq=x) → Server responds with SYN-ACK(seq=y, ack=x+1) → Client confirms with ACK(seq=x+1, ack=y+1), synchronizing Initial Sequence Numbers (ISNs) and allocating socket buffer descriptors."
        }
      ],
      hard: [
        {
          question: "Analyze the architectural trade-offs between Monolithic Kernels and Microkernels regarding performance, isolation, and IPC latency.",
          answer: "Monolithic kernels execute all OS services (VFS, drivers, networking) in ring 0, maximizing IPC throughput via direct function calls but risking kernel panics from faulty drivers. Microkernels run services in user space for fault isolation, but incur context-switch and message-passing IPC overhead."
        },
        {
          question: "How does the OS prevent priority inversion when a low-priority thread holds a mutex needed by a high-priority thread?",
          answer: "Apply the Priority Inheritance Protocol: the low-priority thread temporarily inherits the highest priority of any thread waiting on its lock, allowing it to complete its critical section swiftly and prevent intermediate-priority threads from preemption."
        }
      ],
      totalCount: 8
    };
  }

  // 4. Default Rigorous Academic Engineering Deck
  return {
    courseCode,
    documentTitle: cleanName,
    easy: [
      {
        question: `What is the foundational definition and primary objective of ${cleanName}?`,
        answer: `${cleanName} establishes the theoretical principles, operational models, and quantitative standards required to design, implement, and validate structured solutions within the domain.`
      },
      {
        question: `What core terminology and invariant constraints govern ${cleanName}?`,
        answer: `Core terminology includes deterministic state transitions, modular boundary isolation, interface contract compliance, and resource allocation bounds.`
      },
      {
        question: `What is the role of baseline verification and validation in ${cleanName}?`,
        answer: `Verification confirms the system adheres to specified technical requirements, while validation ensures the output accurately solves the intended domain problem under real-world conditions.`
      },
      {
        question: `How are inputs and outputs structured and sanitized within ${cleanName}?`,
        answer: `Inputs undergo structural schema validation, normalization, and bounds-checking before passing into execution pipelines, guaranteeing deterministic state propagation.`
      }
    ],
    medium: [
      {
        question: `How do the core sub-components and workflows in ${cleanName} coordinate to prevent processing bottlenecks?`,
        answer: `They employ asynchronous decoupling, pipelined staging, and structured queuing to balance resource utilization without causing starvation or race conditions.`
      },
      {
        question: `What key structural trade-offs exist between centralized coordination and distributed modular execution in ${cleanName}?`,
        answer: `Centralized coordination simplifies state consistency and global monitoring but creates a single point of failure, whereas distributed modular execution increases fault tolerance at the cost of synchronization complexity.`
      }
    ],
    hard: [
      {
        question: `Analyze the critical engineering trade-offs between throughput, latency, and fault resilience when scaling ${cleanName}.`,
        answer: `Maximizing throughput through batching or parallelization increases end-to-end latency and state reconciliation overhead, requiring defensive retry policies, idempotent transactions, and invariant checkpoints.`
      },
      {
        question: `How would you design a robust fault-tolerance strategy to handle unexpected anomalies or edge-case failures in ${cleanName}?`,
        answer: `Implement circuit breakers, fallback state caches, automated health heartbeats, and atomic rollback protocols to preserve data integrity and prevent cascading failure.`
      }
    ],
    totalCount: 8
  };
}

/**
 * High-Precision Academic Fallback Generator
 * Analyzes clean document text or synthesizes rigorous topic flashcards
 */
function heuristicFlashcardsGenerator(rawText: string, courseCode: string, documentTitle?: string): TieredFlashcardsResult {
  const cleanText = cleanPortalMetadata(extractCleanText(rawText));
  const docTitle = (documentTitle || "").replace(/\.[a-zA-Z0-9]+$/, "").trim();

  // If text is minimal or mostly metadata, use rich domain knowledge synthesis
  const meaningfulSentences = cleanText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 25 && !BANNED_TERMS.has(s.toLowerCase()));

  if (meaningfulSentences.length < 3) {
    return synthesizeTopicFlashcards(docTitle || courseCode, courseCode);
  }

  // Extract candidate terms from genuine body text
  const candidateTerms: string[] = [];
  const definitions: Array<{ term: string; explanation: string }> = [];

  meaningfulSentences.forEach(s => {
    const defMatch = s.match(/([A-Z][a-zA-Z0-9\s-]{2,35})\s+(?:is defined as|refers to|is a mechanism for|is an?|denotes|represents|means|consists of)\s+([^.!?]+)/i);
    if (defMatch) {
      const term = defMatch[1].trim();
      const explanation = defMatch[2].trim();
      if (term.length > 2 && !BANNED_TERMS.has(term.toLowerCase())) {
        candidateTerms.push(term);
        definitions.push({ term, explanation: `${term} is ${explanation.replace(/^[a-z]/, c => c.toLowerCase())}.` });
      }
    }
  });

  // If fewer than 2 definitions found, fallback to topic synthesis to guarantee deep quality
  if (definitions.length < 2) {
    return synthesizeTopicFlashcards(docTitle || courseCode, courseCode);
  }

  const easy: Array<{ question: string; answer: string }> = definitions.slice(0, 4).map(d => ({
    question: `What is the core definition and functional purpose of ${d.term}?`,
    answer: d.explanation
  }));

  const medium: Array<{ question: string; answer: string }> = [
    {
      question: `How do the primary mechanisms in ${definitions[0]?.term || docTitle} interact with related system components?`,
      answer: meaningfulSentences[1] || `${definitions[0]?.term || docTitle} coordinates state transformations across upstream and downstream modules.`
    },
    {
      question: `What key operational distinctions govern the workflow of ${docTitle || "this topic"}?`,
      answer: meaningfulSentences[2] || "It decouples data acquisition from execution rules to preserve deterministic consistency."
    }
  ];

  const hard: Array<{ question: string; answer: string }> = [
    {
      question: `Critically analyze the architectural trade-offs and constraints identified in ${docTitle}:`,
      answer: meaningfulSentences[3] || "Balancing throughput and consistency requires defensive validation checkpoints and modular isolation."
    },
    {
      question: `How would you synthesize these principles to design an optimal, anomaly-resilient architecture for ${docTitle}?`,
      answer: "Apply fault-isolation boundaries, automated fallback caches, and continuous invariant verification across all execution stages."
    }
  ];

  return {
    courseCode,
    documentTitle: docTitle || "Course Study Material",
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

    const cleanText = extractCleanText(text);
    const subjectName = (documentTitle || "")
      .replace(/\.[a-zA-Z0-9]+$/, "")
      .replace(/\([0-9]+\)/g, "")
      .replace(/[-_]/g, " ")
      .trim() || "Course Material";

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    // Execute with Gemini 1.5 Flash structured output
    if (apiKey) {
      try {
        const systemPrompt = `You are an expert university professor and instructional designer specializing in ${subjectName} (${courseCode}).
Analyze the provided document text and create a rigorous, comprehensive set of university-level flashcards grounded STRICTLY in the exact terminology, named algorithms, definitions, formulas, workflows, and concepts present in the text.

CRITICAL INSTRUCTIONS & ACCURACY RULES:
1. NEVER use generic placeholder questions like "What is the subject matter of ${courseCode}?" or "What are the direct terms introduced in this module?".
2. NEVER treat raw numeric course codes (like "${courseCode}") as conceptual terms. Always use the actual academic topic name ("${subjectName}") and real terms from the document.
3. Every single flashcard MUST focus on a SPECIFIC, REAL concept, entity, algorithm, methodology, or term found in the document text.
4. Classify each card into one of three strict academic difficulty tiers:
   - EASY (Definitions & Direct Facts): Clear definitions, core terminology, and explicit factual rules.
   - MEDIUM (Conceptual Mechanisms & Relationships): Step-by-step workflows, comparative distinctions between two concepts, and cause-and-effect relationships.
   - HARD (Analysis, Synthesis & Trade-offs): Architectural trade-offs, scalability bottlenecks, failure modes, constraint evaluation, and design synthesis.

Return ONLY a valid JSON object matching this exact structure:
{
  "courseCode": "${courseCode}",
  "documentTitle": "${documentTitle || subjectName}",
  "easy": [
    { "question": "What is the exact definition and purpose of [Specific Concept X]?", "answer": "[Direct definition and purpose based solely on the text]..." }
  ],
  "medium": [
    { "question": "How does [Concept A] interact with or differ from [Concept B] in [Workflow/Process]?", "answer": "[Clear conceptual explanation]..." }
  ],
  "hard": [
    { "question": "What are the primary architectural trade-offs, failure modes, or constraints when implementing [Complex Topic C]?", "answer": "[Deep analytical synthesis]..." }
  ]
}

DOCUMENT TEXT:
${cleanText.slice(0, 16000)}
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: systemPrompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.15
            }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            const easyCards = Array.isArray(parsed.easy) && parsed.easy.length > 0 ? parsed.easy : [];
            const mediumCards = Array.isArray(parsed.medium) && parsed.medium.length > 0 ? parsed.medium : [];
            const hardCards = Array.isArray(parsed.hard) && parsed.hard.length > 0 ? parsed.hard : [];

            if (easyCards.length > 0 || mediumCards.length > 0 || hardCards.length > 0) {
              return NextResponse.json({
                success: true,
                result: {
                  courseCode: parsed.courseCode || courseCode,
                  documentTitle: parsed.documentTitle || documentTitle || subjectName,
                  easy: easyCards,
                  medium: mediumCards,
                  hard: hardCards,
                  totalCount: easyCards.length + mediumCards.length + hardCards.length
                },
                source: "gemini"
              });
            }
          }
        }
      } catch (aiErr) {
        console.warn("AI generation failed, applying advanced domain heuristic generator:", aiErr);
      }
    }

    // High-Precision Domain Heuristic Fallback
    const fallbackResult = heuristicFlashcardsGenerator(cleanText, courseCode, documentTitle);
    return NextResponse.json({
      success: true,
      result: fallbackResult,
      source: "domain_heuristic"
    });

  } catch (err: any) {
    console.error("Flashcard generation error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate flashcards." },
      { status: 500 }
    );
  }
}
