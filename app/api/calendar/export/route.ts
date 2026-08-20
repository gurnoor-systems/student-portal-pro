import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || "student";

  // Generate RFC 5545 iCalendar feed content
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
    "X-WR-CALNAME:Student Portal Pro - Academic Schedule",
    "X-WR-TIMEZONE:UTC",
    
    // Sample Deliverable Event 1
    "BEGIN:VEVENT",
    `UID:task-cs350-paging-${userId}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(new Date(now.getTime() + 86400000 * 2))}`,
    `DTEND:${formatICSDate(new Date(now.getTime() + 86400000 * 2 + 3600000))}`,
    "SUMMARY:[CS 350] OS161 Kernel Virtual Memory Paging",
    "DESCRIPTION:Operating Systems Assignment Milestone\\nPriority: HIGH",
    "STATUS:CONFIRMED",
    "END:VEVENT",

    // Sample Exam Event 2
    "BEGIN:VEVENT",
    `UID:exam-cs341-midterm-${userId}`,
    `DTSTAMP:${formatICSDate(now)}`,
    `DTSTART:${formatICSDate(new Date(now.getTime() + 86400000 * 6))}`,
    `DTEND:${formatICSDate(new Date(now.getTime() + 86400000 * 6 + 7200000))}`,
    "SUMMARY:[CS 341] Algorithms Midterm Examination",
    "DESCRIPTION:Location: Main Examination Hall 1350\\nWeight: 30%",
    "STATUS:CONFIRMED",
    "END:VEVENT",

    "END:VCALENDAR"
  ];

  const icsContent = icsLines.join("\r\n");

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="student_academic_schedule.ics"`
    }
  });
}
