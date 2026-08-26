import { NextRequest, NextResponse } from "next/server";

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

    const apiKey = process.env.GEMINI_API_KEY;
    const currentDate = new Date().toISOString().split("T")[0];
    const currentDay = new Date().toLocaleDateString("en-US", { weekday: "long" });

    // Format student's live context for system prompt
    const studentContext = `
Student Information:
- Current Date & Day: ${currentDay}, ${currentDate}
- Name: ${context?.userName || "Student"}
- University / Program: ${context?.university || "University"} (${context?.major || "Undergraduate"})
- Active Semester: ${context?.semester || "Current Semester"}

Enrolled Courses:
${(context?.courses || []).map((c: any) => `- [${c.courseCode}] ${c.courseName} (Instructor: ${c.instructor || "Professor"})`).join("\n") || "No courses registered yet."}

Active Assignments & Deadlines:
${(context?.tasks || []).map((t: any) => `- Task ID: "${t.id}" | ${t.title} [${t.courseCode}] | Due: ${t.dueDate} | Priority: ${t.priority} | Status: ${t.status}`).join("\n") || "No active tasks."}

Upcoming Exams:
${(context?.exams || []).map((e: any) => `- [${e.courseCode}] ${e.title} on ${e.examDate} (Weight: ${e.weightPercent || 20}%)`).join("\n") || "No exams scheduled."}

Daily Routine & Schedule:
${(context?.routines || []).map((r: any) => `- ${r.timeSlot}: ${r.title} (${r.completed ? "Done" : "Pending"})`).join("\n") || "No routine blocks scheduled."}
`;

    if (apiKey) {
      try {
        const systemInstruction = `
You are the Intelligent Academic AI Copilot for Student Portal Pro.
Your role:
1. Provide accurate, encouraging, insightful academic guidance, study schedules, concept explanations, and deadline analysis.
2. You have FULL APP KNOWLEDGE and LIVE CONTEXT of the student's tasks, courses, exams, and routines.
3. You can AUTONOMOUSLY EXECUTE IN-APP ACTIONS for the student whenever they ask to create, schedule, focus, or complete something.

When the student asks to take an action (e.g. "add a task", "schedule a study block", "start a focus session", "mark task done", "open calendar"), you MUST provide structured actions in your JSON response alongside your helpful reply.

Supported Action Types & Payloads:
- CREATE_TASK:
  payload: { "title": string, "courseCode": string, "dueDate": "YYYY-MM-DD", "priority": "high" | "medium" | "low", "estimatedHours": number, "description": string }
- SCHEDULE_ROUTINE:
  payload: { "title": string, "startTime": "HH:MM", "durationMinutes": number, "category": "morning" | "focus" | "evening" | "custom", "notes": string }
- START_FOCUS:
  payload: { "durationMinutes": number, "soundscape": "parisian_cafe" | "rain" | "waves" | "binaural" }
- COMPLETE_TASK:
  payload: { "taskId": string, "title": string }
- NAVIGATE_TAB:
  payload: { "tabId": "summary" | "routine" | "tracker" | "classrooms" | "calendar" | "exams" | "flashcards" | "documents" | "analytics" }

RESPONSE FORMAT: You must return a valid JSON object strictly matching this schema:
{
  "reply": "Your markdown-formatted conversational explanation, advice, or confirmation.",
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
        console.warn("Gemini AI Copilot failed, using deterministic agent fallback:", aiErr);
      }
    }

    // Deterministic Rule-Based Copilot Fallback (Runs zero-latency without API dependencies)
    const lower = message.toLowerCase();
    const actions: AgentAction[] = [];
    let reply = "";

    // 1. Task Creation Heuristic
    if (lower.includes("add task") || lower.includes("create task") || lower.includes("remind me to") || lower.includes("add assignment")) {
      const titleClean = message.replace(/(add task|create task|remind me to|add assignment|new task)/i, "").trim() || "New Assignment";
      
      // Attempt course match
      const matchedCourse = (context?.courses || []).find((c: any) => 
        lower.includes(c.courseCode.toLowerCase())
      )?.courseCode || (context?.courses?.[0]?.courseCode || "GEN-101");

      const isHigh = lower.includes("high") || lower.includes("urgent") || lower.includes("important");
      const targetDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // 3 days out

      actions.push({
        type: "CREATE_TASK",
        payload: {
          title: titleClean,
          courseCode: matchedCourse,
          dueDate: targetDue,
          priority: isHigh ? "high" : "medium",
          estimatedHours: 3
        },
        summary: `Created assignment "${titleClean}" under [${matchedCourse}] due ${targetDue}.`
      });

      reply = `I have scheduled the new assignment **"${titleClean}"** under **${matchedCourse}** with ${isHigh ? "High" : "Medium"} priority. You can see it on your Kanban Board!`;
    }
    // 2. Focus Sanctuary Heuristic
    else if (lower.includes("focus") || lower.includes("pomodoro") || lower.includes("study session") || lower.includes("start study")) {
      const minutes = lower.includes("50") ? 50 : lower.includes("45") ? 45 : 25;
      actions.push({
        type: "START_FOCUS",
        payload: { durationMinutes: minutes, soundscape: "parisian_cafe" },
        summary: `Launched ${minutes}-minute Focus Sanctuary study session.`
      });
      reply = `Opening the **Focus Sanctuary** for a **${minutes}-minute** deep study session with ambient Parisian acoustic audio. Let's get into the flow! 🎧`;
    }
    // 3. Routine Scheduling Heuristic
    else if (lower.includes("schedule") || lower.includes("routine") || lower.includes("timeblock")) {
      actions.push({
        type: "SCHEDULE_ROUTINE",
        payload: {
          title: "Deep Focus Study Session",
          startTime: "16:00",
          durationMinutes: 45,
          category: "focus",
          notes: "Scheduled by AI Copilot"
        },
        summary: "Added a 45-minute Deep Focus block to your Daily Routine timeline."
      });
      reply = `I've added a **45-minute Deep Focus study block** to your **Daily Routine** timeline for 4:00 PM today.`;
    }
    // 4. General Queries
    else if (lower.includes("due") || lower.includes("deadline") || lower.includes("what next")) {
      const activeTasks = (context?.tasks || []).filter((t: any) => t.status !== "completed");
      if (activeTasks.length > 0) {
        reply = `You currently have **${activeTasks.length} active assignments**:\n\n` +
          activeTasks.slice(0, 4).map((t: any) => `• **${t.title}** ([${t.courseCode}]) — Due **${t.dueDate}** (${t.priority.toUpperCase()} priority)`).join("\n") +
          `\n\nWould you like me to schedule a focus study block for any of these?`;
      } else {
        reply = `You have no pending assignments right now! Great job staying on top of your coursework. 🎉`;
      }
    }
    else {
      reply = `Hello **${context?.userName || "there"}**! I am your Academic Copilot. I'm connected to your ${context?.courses?.length || 0} enrolled courses, ${context?.tasks?.length || 0} assignments, and your daily routine.\n\nYou can ask me to:\n• *"What assignments are due this week?"*\n• *"Add a high priority task for Math due Friday"*\n• *"Schedule a 45-min focus block for Physics"*\n• *"Start a 25-min Pomodoro session"*`;
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
