import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase-client";
import fs from "fs";
import path from "path";
import os from "os";

function getDiskAccount(identifier: string) {
  try {
    const dbPath = process.env.VERCEL
      ? path.join(os.tmpdir(), ".student_portal_sync_db.json")
      : path.join(process.cwd(), ".student_portal_sync_db.json");
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, "utf8"));
      const accounts = data.accounts || {};
      for (const email of Object.keys(accounts)) {
        if (accounts[email].id === identifier || email.toLowerCase() === identifier.toLowerCase()) {
          return accounts[email];
        }
      }
    }
  } catch {}
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const identifier = searchParams.get("userId") || searchParams.get("email") || "student";

  let tasks: any[] = [];
  let exams: any[] = [];
  let studentName = "Student";

  // 1. Fetch live data from Supabase Cloud
  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      let query = supabase.from("profiles").select("*");
      if (identifier.includes("@")) {
        query = query.eq("email", identifier.trim().toLowerCase());
      } else {
        query = query.eq("id", identifier.trim());
      }

      const { data, error } = await query.maybeSingle();
      if (data && !error) {
        studentName = data.full_name || studentName;
        tasks = Array.isArray(data.tasks_json) ? data.tasks_json : [];
        exams = Array.isArray(data.exams_json) ? data.exams_json : [];
      }
    } catch (err) {
      console.warn("Calendar export Supabase read notice:", err);
    }
  }

  // 2. Disk fallback if empty
  if (tasks.length === 0 && exams.length === 0) {
    const diskAcc = getDiskAccount(identifier);
    if (diskAcc) {
      studentName = diskAcc.fullName || studentName;
      tasks = diskAcc.tasks || [];
      exams = diskAcc.exams || [];
    }
  }

  // RFC 5545 iCalendar date formatter
  const now = new Date();
  const formatICSDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const icsLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Student Portal Pro//Academic Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${studentName}'s Academic Schedule`,
    "X-WR-TIMEZONE:UTC"
  ];

  // Map real student tasks to VEVENT
  tasks.forEach((task: any, idx: number) => {
    if (task.status === "completed") return; // skip completed deliverables
    const due = task.dueDate ? new Date(task.dueDate) : new Date(now.getTime() + (idx + 1) * 86400000);
    const start = isNaN(due.getTime()) ? new Date(now.getTime() + (idx + 1) * 86400000) : due;
    const end = new Date(start.getTime() + 3600000); // 1 hour event

    const priorityTag = (task.priority || "medium").toUpperCase();
    const course = task.courseCode ? `[${task.courseCode}] ` : "";
    const description = `Priority: ${priorityTag}\\nCategory: ${task.category || "Assignment"}\\nStatus: ${task.status || "Todo"}`;

    icsLines.push(
      "BEGIN:VEVENT",
      `UID:task-${task.id || idx}-${identifier}`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${course}${task.title || "Academic Task"}`,
      `DESCRIPTION:${description}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  });

  // Map real student exams to VEVENT
  exams.forEach((exam: any, idx: number) => {
    const examDate = exam.examDate ? new Date(exam.examDate) : new Date(now.getTime() + (idx + 2) * 86400000);
    const start = isNaN(examDate.getTime()) ? new Date(now.getTime() + (idx + 2) * 86400000) : examDate;
    const end = new Date(start.getTime() + 7200000); // 2 hour exam window

    const course = exam.courseCode ? `[${exam.courseCode}] ` : "";
    const topics = Array.isArray(exam.topics) ? exam.topics.join(", ") : "";
    const description = `Weight: ${exam.weightPercent || 20}%\\nLocation: ${exam.location || "TBA"}${topics ? `\\nTopics: ${topics}` : ""}`;

    icsLines.push(
      "BEGIN:VEVENT",
      `UID:exam-${exam.id || idx}-${identifier}`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART:${formatICSDate(start)}`,
      `DTEND:${formatICSDate(end)}`,
      `SUMMARY:${course}${exam.title || "Examination"}`,
      `DESCRIPTION:${description}`,
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  });

  // Fallback starter items if 0 deliverables exist yet
  if (tasks.length === 0 && exams.length === 0) {
    icsLines.push(
      "BEGIN:VEVENT",
      `UID:sample-task-${identifier}`,
      `DTSTAMP:${formatICSDate(now)}`,
      `DTSTART:${formatICSDate(new Date(now.getTime() + 86400000 * 2))}`,
      `DTEND:${formatICSDate(new Date(now.getTime() + 86400000 * 2 + 3600000))}`,
      "SUMMARY:[CS 350] Operating Systems Assignment Milestone",
      "DESCRIPTION:Operating Systems Assignment Milestone\\nPriority: HIGH",
      "STATUS:CONFIRMED",
      "END:VEVENT"
    );
  }

  icsLines.push("END:VCALENDAR");
  const icsContent = icsLines.join("\r\n");

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="academic_schedule.ics"`
    }
  });
}
