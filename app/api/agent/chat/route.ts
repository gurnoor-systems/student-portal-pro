import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limiter";

export interface AgentAction {
  type: "CREATE_TASK" | "SCHEDULE_ROUTINE" | "START_FOCUS" | "COMPLETE_TASK" | "NAVIGATE_TAB";
  payload: Record<string, any>;
  summary: string;
}

export interface AgentChatResponse {
  reply: string;
  actions?: AgentAction[];
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context, history } = body;

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "127.0.0.1";
    const userIdentifier = context?.userName ? `${context.userName.replace(/\s+/g, "_")}` : "guest";
    
    // Fair-Use Rate Limiter: Max 8 queries per minute per user/IP to protect quotas
    const rateLimitResult = checkRateLimit(`agent_chat:${userIdentifier}:${ip}`, 8, 60 * 1000);
    const isRateLimited = !rateLimitResult.allowed;

    const apiKey = !isRateLimited ? process.env.GEMINI_API_KEY : null;
    const currentDate = new Date().toISOString().split("T")[0];
    const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const studentCourses = Array.isArray(context?.courses) ? context.courses : [];
    const studentTasks = Array.isArray(context?.tasks) ? context.tasks : [];
    const studentExams = Array.isArray(context?.exams) ? context.exams : [];
    const studentRoutines = Array.isArray(context?.routines) ? context.routines : [];

    // Format student's live context for system prompt
    const studentContext = `
Student Information:
- Current Date & Day: ${currentDay}, ${currentDate}
- Name: ${context?.userName || "Student"}
- University / Program: ${context?.university || "University of Delhi"} (${context?.major || "Undergraduate"})
- Active Semester: ${context?.semester || "Semester 1"}

Enrolled Courses (${studentCourses.length}):
${studentCourses.map((c: any) => `- [${c.courseCode}] ${c.courseName} (Instructor: ${c.instructor || "Faculty"})`).join("\n") || "No courses registered yet."}

Active Assignments & Deadlines (${studentTasks.length}):
${studentTasks.map((t: any) => `- Task ID: "${t.id}" | ${t.title} [${t.courseCode}] | Due: ${t.dueDate} | Priority: ${t.priority} | Status: ${t.status}`).join("\n") || "No active tasks."}

Upcoming Exams (${studentExams.length}):
${studentExams.map((e: any) => `- [${e.courseCode}] ${e.title} on ${e.examDate} (Weight: ${e.weightPercent || 20}%)`).join("\n") || "No exams scheduled."}

Daily Routine & Schedule:
${studentRoutines.map((r: any) => `- ${r.timeSlot}: ${r.title} (${r.completed ? "Done" : "Pending"})`).join("\n") || "No routine blocks scheduled."}
`;

    // 1. Primary Engine: Gemini 1.5 Flash
    if (apiKey) {
      try {
        const systemInstruction = `
You are the Intelligent Academic AI Copilot for Student Portal Pro.
Your role:
1. Provide accurate, encouraging, insightful academic guidance, study schedules, concept explanations, and exam preparation strategies.
2. You have FULL APP KNOWLEDGE and LIVE CONTEXT of the student's tasks, courses, exams, and routines.
3. You can AUTONOMOUSLY EXECUTE IN-APP ACTIONS for the student whenever they ask to create, schedule, focus, prepare for exams, or complete tasks.
4. When asked for exam prep, build a tailored, structured multi-phase plan based on their enrolled courses and provide actionable Kanban/Routine creation payloads.

Supported Action Types & Payloads:
- CREATE_TASK: { "title": string, "courseCode": string, "dueDate": "YYYY-MM-DD", "priority": "high" | "medium" | "low", "estimatedHours": number, "description": string }
- SCHEDULE_ROUTINE: { "title": string, "startTime": "HH:MM", "durationMinutes": number, "category": "morning" | "focus" | "evening" | "custom", "notes": string }
- START_FOCUS: { "durationMinutes": number, "soundscape": "parisian_cafe" | "ocean" | "vinyl" | "theta" }
- COMPLETE_TASK: { "taskId": string, "title": string }
- NAVIGATE_TAB: { "tabId": "summary" | "routine" | "tracker" | "classrooms" | "calendar" | "exams" | "flashcards" | "documents" | "analytics" }

RESPONSE FORMAT: You must return a valid JSON object strictly matching this schema:
{
  "reply": "Your markdown-formatted conversational explanation, advice, or structured study roadmap.",
  "actions": [
    {
      "type": "CREATE_TASK" | "SCHEDULE_ROUTINE" | "START_FOCUS" | "COMPLETE_TASK" | "NAVIGATE_TAB",
      "payload": { ... },
      "summary": "Brief 1-sentence summary of the action taken"
    }
  ]
}
`;

        const prompt = `
${studentContext}

Conversation History:
${(history || []).slice(-6).map((h: any) => `${h.role === "user" ? "Student" : "Copilot"}: ${h.content}`).join("\n")}

Student Prompt:
${message}
`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: prompt }] }],
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
            const parsed = JSON.parse(jsonText) as AgentChatResponse;
            return NextResponse.json({ success: true, ...parsed });
          }
        }
      } catch (aiErr) {
        console.warn("Gemini AI Copilot unreachable, falling back to Intelligent Academic Engine:", aiErr);
      }
    }

    // 2. High-IQ Intelligent Academic Engine (Zero-Latency, Typo-Tolerant, Zero-API Quota Cost)
    const lower = message.toLowerCase().trim();
    const actions: AgentAction[] = [];
    let reply = "";

    const primaryCourse = studentCourses[0]?.courseCode || "CS101";
    const primaryCourseName = studentCourses[0]?.courseName || "Core Academic Studies";
    const secondaryCourse = studentCourses[1]?.courseCode || "MATH101";
    const secondaryCourseName = studentCourses[1]?.courseName || "Applied Sciences";

    // 🧠 Intent A: Exam Preparation / Revision Roadmap (Handles typos: "gnerate", "prep", "past record")
    if (
      lower.includes("exam prep") ||
      lower.includes("prep based") ||
      lower.includes("revision") ||
      lower.includes("study plan") ||
      lower.includes("study roadmap") ||
      lower.includes("past record") ||
      lower.includes("prepare for exam") ||
      (lower.includes("exam") && (lower.includes("gnerate") || lower.includes("generate") || lower.includes("create") || lower.includes("plan") || lower.includes("schedule")))
    ) {
      const targetDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const activeTasksCount = studentTasks.filter((t: any) => t.status !== "completed").length;

      // Autonomously attach in-app actions
      actions.push({
        type: "CREATE_TASK",
        payload: {
          title: `Comprehensive Exam Prep Mock • ${primaryCourse}`,
          courseCode: primaryCourse,
          dueDate: targetDue,
          priority: "high",
          estimatedHours: 3,
          description: `Generated by Academic AI Copilot based on ${context?.semester || "current term"} workload.`
        },
        summary: `Created high-priority exam preparation milestone for [${primaryCourse}].`
      });

      actions.push({
        type: "SCHEDULE_ROUTINE",
        payload: {
          title: `Deep Focus Exam Revision • ${primaryCourse}`,
          startTime: "15:00",
          durationMinutes: 60,
          category: "focus",
          notes: "Scheduled by AI Copilot"
        },
        summary: `Added a 60-minute Deep Focus block to your Daily Routine for 3:00 PM.`
      });

      const courseListMarkdown = studentCourses.length > 0
        ? studentCourses.slice(0, 3).map((c: any) => `* **${c.courseName}** (\`${c.courseCode}\`): High-yield syllabus review & practice problems.`).join("\n")
        : `* **${primaryCourseName}** (\`${primaryCourse}\`): Core algorithmic principles & fundamental theorems.\n* **${secondaryCourseName}** (\`${secondaryCourse}\`): Problem sets & theoretical proofs.`;

      reply = `### 🎯 Academic Exam Preparation Strategy • **${context?.semester || "Semester 1"}**

Based on your academic record at **${context?.university || "University of Delhi"}** (${studentCourses.length} enrolled courses, ${activeTasksCount} active assignments), here is your customized 3-phase preparation plan:

---

#### 📚 Phase 1: High-Yield Syllabus Mapping (Days 1–2)
${courseListMarkdown}

#### 🧠 Phase 2: Active Recall & Timed Problem Sets (Days 3–4)
* Complete 25-minute Pomodoro sprints solving past exam questions under exam conditions.
* Review AI summary flashcards for high-frequency formulas and definitions.

#### 🏁 Phase 3: Full Mock Exam & Confidence Calibration (Day 5)
* Complete a full-length timed mock simulation to test velocity and accuracy.

---

⚡ **Actions autonomously scheduled for you:**
* Added **"Comprehensive Exam Prep Mock • ${primaryCourse}"** (High Priority) to your Kanban Board.
* Scheduled a **60-min Deep Focus Block** at 3:00 PM in your Daily Routine timeline.`;
    }

    // 📋 Intent B: Task Creation (Handles "add task", "create assignment", "remind me to", etc.)
    else if (
      lower.includes("add task") || 
      lower.includes("create task") || 
      lower.includes("remind me") || 
      lower.includes("add assignment") ||
      lower.includes("new assignment") ||
      lower.includes("add homework")
    ) {
      const cleanTitle = message
        .replace(/(add task|create task|remind me to|remind me|add assignment|new assignment|add homework)/i, "")
        .trim() || "New Academic Deliverable";

      const matchedCourse = studentCourses.find((c: any) => 
        lower.includes(c.courseCode.toLowerCase()) || lower.includes(c.courseName.toLowerCase())
      )?.courseCode || primaryCourse;

      const isHigh = lower.includes("high") || lower.includes("urgent") || lower.includes("important");
      const targetDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      actions.push({
        type: "CREATE_TASK",
        payload: {
          title: cleanTitle,
          courseCode: matchedCourse,
          dueDate: targetDue,
          priority: isHigh ? "high" : "medium",
          estimatedHours: 2.5
        },
        summary: `Created assignment "${cleanTitle}" under [${matchedCourse}] due ${targetDue}.`
      });

      reply = `I have scheduled the new assignment **"${cleanTitle}"** under **[${matchedCourse}]** with **${isHigh ? "HIGH" : "MEDIUM"}** priority due on **${targetDue}**. It is now active on your Kanban Board!`;
    }

    // 🎧 Intent C: Focus Sanctuary & Pomodoro
    else if (
      lower.includes("focus") || 
      lower.includes("pomodoro") || 
      lower.includes("study session") || 
      lower.includes("start study") ||
      lower.includes("deep work") ||
      lower.includes("binaural")
    ) {
      const minutes = lower.includes("50") ? 50 : lower.includes("45") ? 45 : lower.includes("90") ? 90 : 25;
      const soundscape = lower.includes("ocean") ? "ocean" : lower.includes("vinyl") ? "vinyl" : lower.includes("theta") || lower.includes("binaural") ? "theta" : "parisian_cafe";

      actions.push({
        type: "START_FOCUS",
        payload: { durationMinutes: minutes, soundscape },
        summary: `Launched ${minutes}-minute Focus Sanctuary session with ${soundscape} audio.`
      });

      reply = `Opening the **Focus Sanctuary** for a **${minutes}-minute** deep focus block with immersive ambient sound. Let's enter the flow state! 🎧`;
    }

    // 📅 Intent D: Daily Routine Scheduling & Timeblocking
    else if (
      lower.includes("schedule") || 
      lower.includes("routine") || 
      lower.includes("timeblock") || 
      lower.includes("daily block")
    ) {
      actions.push({
        type: "SCHEDULE_ROUTINE",
        payload: {
          title: `Deep Focus Study Block • ${primaryCourse}`,
          startTime: "16:00",
          durationMinutes: 45,
          category: "focus",
          notes: "Scheduled by AI Copilot"
        },
        summary: "Added a 45-minute Deep Focus block to your Daily Routine timeline."
      });

      reply = `I've added a **45-minute Deep Focus study block** for **${primaryCourseName}** to your **Daily Routine** timeline at 4:00 PM today.`;
    }

    // 🔍 Intent E: Deadlines & Course Overview
    else if (
      lower.includes("due") || 
      lower.includes("deadline") || 
      lower.includes("what next") || 
      lower.includes("pending") ||
      lower.includes("assignments")
    ) {
      const activeTasks = studentTasks.filter((t: any) => t.status !== "completed");
      if (activeTasks.length > 0) {
        reply = `You currently have **${activeTasks.length} active assignments**:\n\n` +
          activeTasks.slice(0, 4).map((t: any) => `• **${t.title}** (\`${t.courseCode}\`) — Due **${t.dueDate}** (${t.priority.toUpperCase()} priority)`).join("\n") +
          `\n\nWould you like me to schedule a focused study block or launch the Focus Room for any of these?`;
      } else {
        reply = `You have no pending assignments right now! Your academic backlog is clear. 🎉`;
      }
    }

    // 🃏 Intent F: Flashcards & Active Recall
    else if (
      lower.includes("flashcard") || 
      lower.includes("recall") || 
      lower.includes("formula") || 
      lower.includes("quiz")
    ) {
      actions.push({
        type: "NAVIGATE_TAB",
        payload: { tabId: "flashcards" },
        summary: "Navigated to Flashcards & Active Recall Hub."
      });

      reply = `Opening your **Flashcards & Active Recall Hub**! You can test your recall across your ${studentCourses.length} courses with spaced repetition and instant AI question generation. 🧠`;
    }

    // 💬 Intent G: General Helpful Guidance
    else {
      reply = `Hello **${context?.userName || "Scholar"}**! I am your **Academic AI Copilot** at **${context?.university || "University of Delhi"}**.\n\nI have live awareness of your **${studentCourses.length} enrolled courses** and **${studentTasks.filter((t: any) => t.status !== "completed").length} active deliverables**.\n\nHere are some things you can ask me:\n* *"Generate me an exam prep based on my past record"*\n* *"Add high-priority assignment for ${primaryCourse} due Friday"*\n* *"Schedule a 45-min Deep Focus block for today"*\n* *"What deadlines are coming up this week?"*`;
    }

    return NextResponse.json({
      success: true,
      reply,
      actions
    });

  } catch (err: any) {
    console.error("Agent chat endpoint error:", err);
    return NextResponse.json({ error: err.message || "Failed to process chat" }, { status: 500 });
  }
}

