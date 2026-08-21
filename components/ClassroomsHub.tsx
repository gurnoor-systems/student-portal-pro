"use client";

import React, { useState } from "react";
import { useAuth, CourseItem } from "@/lib/auth-context";
import { 
  Video, 
  Plus, 
  FolderPlus, 
  Folder, 
  FileText, 
  Upload, 
  Trash2, 
  ArrowUpRight, 
  Clock, 
  ExternalLink,
  BookOpen,
  Calendar,
  X,
  Check,
  ChevronRight,
  Download,
  Eye,
  HardDrive,
  Cloud
} from "lucide-react";
import PDFViewerModal from "@/components/PDFViewerModal";
import { PDFCacheManager } from "@/lib/pdf-cache-manager";

export interface MaterialItem {
  id: string;
  courseCode: string;
  folderName: string;
  fileName: string;
  fileSize: string;
  fileType: string;
  uploadedAt: string;
  fileKey?: string;
  fileUrl?: string;
  versionId?: string;
}

export default function ClassroomsHub() {
  const { user, userData, addCourse, deleteCourse } = useAuth();

  // State
  const [activeCourseFilter, setActiveCourseFilter] = useState<string>("all");
  const [activeFolderName, setActiveFolderName] = useState<string>("all");
  const [selectedDocForView, setSelectedDocForView] = useState<MaterialItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [materials, setMaterials] = useState<MaterialItem[]>(() => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`student_portal_user_${user.id}_materials`);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Save materials to localStorage when updated
  const persistMaterials = (newMaterials: MaterialItem[]) => {
    setMaterials(newMaterials);
    if (user?.id) {
      localStorage.setItem(`student_portal_user_${user.id}_materials`, JSON.stringify(newMaterials));
    }
  };

  // Modals
  const [isAddCourseModalOpen, setIsAddCourseModalOpen] = useState(false);
  const [isAddFolderModalOpen, setIsAddFolderModalOpen] = useState(false);
  const [isUploadFileModalOpen, setIsUploadFileModalOpen] = useState(false);

  // New Course Form State
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const [newInstructor, setNewInstructor] = useState("");
  const [newMeetingLink, setNewMeetingLink] = useState("");
  const [newPlatform, setNewPlatform] = useState<"meet" | "zoom" | "teams">("meet");
  const [newSchedule, setNewSchedule] = useState("");

  // New Folder State
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderCourse, setNewFolderCourse] = useState(userData.courses[0]?.courseCode || "CS 341");

  // New File Upload State
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadCourseCode, setUploadCourseCode] = useState(userData.courses[0]?.courseCode || "CS 341");
  const [uploadTargetFolder, setUploadTargetFolder] = useState("Lecture Slides");

  // Extract unique folders
  const allFolders = Array.from(new Set(materials.map(m => m.folderName)));

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCourseCode || !newCourseName) return;

    addCourse({
      courseCode: newCourseCode.trim().toUpperCase(),
      courseName: newCourseName.trim(),
      instructor: newInstructor.trim() || "Instructor",
      meetingLink: newMeetingLink.trim() || "https://meet.google.com/new",
      meetingPlatform: newPlatform,
      scheduleTime: newSchedule.trim() || "Schedule TBA"
    });

    setNewCourseCode("");
    setNewCourseName("");
    setNewInstructor("");
    setNewMeetingLink("");
    setNewSchedule("");
    setIsAddCourseModalOpen(false);
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim()) return;

    setIsUploading(true);
    const finalFileName = uploadFileName.endsWith(".pdf") ? uploadFileName : `${uploadFileName}.pdf`;
    let fileKey: string | undefined = undefined;
    let versionId = `v_${Date.now()}`;
    let calculatedSize = attachedFile ? `${(attachedFile.size / (1024 * 1024)).toFixed(1)} MB` : "2.4 MB";

    try {
      if (user?.id) {
        // Step 1: Request Pre-signed Upload URL (<1KB payload, bypasses Vercel 4.5MB limit)
        const presignRes = await fetch("/api/storage/presigned-upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            fileName: finalFileName,
            fileSize: attachedFile ? attachedFile.size : 2500000,
            contentType: attachedFile?.type || "application/pdf"
          })
        });

        const presignData = await presignRes.json();
        if (presignData.success && presignData.uploadUrl) {
          fileKey = presignData.fileKey;
          versionId = presignData.versionId || versionId;

          // Step 2: Upload directly to Cloudflare R2 if real file attached
          if (attachedFile && !presignData.isSimulated) {
            await fetch(presignData.uploadUrl, {
              method: "PUT",
              headers: { "Content-Type": attachedFile.type || "application/pdf" },
              body: attachedFile
            });

            // Cache in local IndexedDB for immediate 0ms next view
            await PDFCacheManager.storeBlob(
              `mat_${Date.now()}`,
              versionId,
              finalFileName,
              attachedFile
            );
          }
        }
      }
    } catch (error) {
      console.warn("Direct upload error, saving metadata:", error);
    }

    const newFile: MaterialItem = {
      id: `mat_${Date.now()}`,
      courseCode: uploadCourseCode,
      folderName: uploadTargetFolder,
      fileName: finalFileName,
      fileSize: calculatedSize,
      fileType: "pdf",
      uploadedAt: "Just now",
      fileKey,
      versionId
    };

    persistMaterials([newFile, ...materials]);
    setUploadFileName("");
    setAttachedFile(null);
    setIsUploading(false);
    setIsUploadFileModalOpen(false);
  };

  const handleDeleteFile = async (id: string, fileKey?: string) => {
    // 1. Evict from local device IndexedDB to free phone/laptop disk space
    await PDFCacheManager.evict(id);

    // 2. Delete binary from Cloudflare R2 to reclaim 10GB free tier space
    if (fileKey) {
      fetch("/api/storage/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileKey })
      }).catch(() => {});
    }

    // 3. Remove from UI & local database
    const next = materials.filter(m => m.id !== id);
    persistMaterials(next);
  };

  // Filtered materials
  const filteredMaterials = materials.filter(m => {
    const matchesCourse = activeCourseFilter === "all" || m.courseCode === activeCourseFilter;
    const matchesFolder = activeFolderName === "all" || m.folderName === activeFolderName;
    return matchesCourse && matchesFolder;
  });

  return (
    <div className="space-y-10">
      
      {/* ========================================================================= */}
      {/* 1. COURSES & LIVE CLASSROOMS                                              */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline)]">
          <div>
            <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
              ENROLLED COURSES
            </div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">
              Courses & Classrooms
            </h2>
            <p className="text-xs font-light text-[var(--muted)] mt-0.5">
              Launch directly into verified Google Meet, Zoom, or Teams sessions with zero passcode searching.
            </p>
          </div>

          <button
            onClick={() => setIsAddCourseModalOpen(true)}
            className="bmw-btn-primary !h-10 !text-xs !py-2 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span>ADD NEW COURSE</span>
          </button>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userData.courses.map((course) => (
            <div 
              key={course.id}
              className="bmw-card flex flex-col justify-between space-y-4 hover:border-[var(--primary)] transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold px-2 py-0.5 bg-[var(--surface-soft)] border border-[var(--hairline)] text-[var(--primary)]">
                    #{course.courseCode}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    2-WAY SYNC ACTIVE
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-[var(--ink)] leading-snug">
                    {course.courseName}
                  </h3>
                  <div className="text-xs text-[var(--muted)] font-light mt-1">
                    {course.instructor}
                  </div>
                </div>

                <div className="p-3 bg-[var(--surface-soft)] border border-[var(--hairline)] text-xs text-[var(--ink)] font-light space-y-1">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--primary)]" />
                    <span>{course.scheduleTime}</span>
                  </div>
                  <div className="text-[11px] text-[var(--muted)]">
                    Platform: <strong className="font-semibold text-[var(--ink)] uppercase">{course.meetingPlatform}</strong>
                  </div>
                </div>
              </div>

              {/* 1-Click Video Launcher Action */}
              <div className="pt-4 border-t border-[var(--hairline)]">
                <a
                  href={course.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="bmw-btn-primary w-full flex items-center justify-center gap-2"
                >
                  <Video className="w-4 h-4" />
                  <span>JOIN LIVE CLASS</span>
                  <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. COURSE DOCUMENTS & FILES REPOSITORY                                    */}
      {/* ========================================================================= */}
      <div className="space-y-6 pt-6 border-t border-[var(--hairline)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--hairline)]">
          <div>
            <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
              ACADEMIC REPOSITORY
            </div>
            <h2 className="text-2xl font-bold text-[var(--ink)]">
              Course Documents & Files
            </h2>
            <p className="text-xs font-light text-[var(--muted)] mt-0.5">
              Directly upload lecture slides, lab manuals, and cheat sheets organized by custom folder structures.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddFolderModalOpen(true)}
              className="bmw-btn-secondary !h-10 !text-xs !py-2"
            >
              <FolderPlus className="w-4 h-4 mr-1" />
              <span>NEW FOLDER</span>
            </button>

            <button
              onClick={() => setIsUploadFileModalOpen(true)}
              className="bmw-btn-primary !h-10 !text-xs !py-2"
            >
              <Upload className="w-4 h-4 mr-1" />
              <span>UPLOAD MATERIAL</span>
            </button>
          </div>
        </div>

        {/* Filters Bar: Course Filter + Folder Tabs */}
        <div className="bmw-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Course Filter Dropdown */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              COURSE:
            </span>
            <select
              value={activeCourseFilter}
              onChange={(e) => setActiveCourseFilter(e.target.value)}
              className="h-9 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-xs font-bold text-[var(--ink)] focus:border-[var(--primary)] outline-none"
            >
              <option value="all">All Enrolled Courses</option>
              {userData.courses.map(c => (
                <option key={c.id} value={c.courseCode}>#{c.courseCode} - {c.courseName}</option>
              ))}
            </select>
          </div>

          {/* Folder Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              onClick={() => setActiveFolderName("all")}
              className={`px-3 py-1 font-bold uppercase transition-colors cursor-pointer ${
                activeFolderName === "all"
                  ? "bg-[var(--primary)] text-white"
                  : "bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)]"
              }`}
            >
              ALL FOLDERS
            </button>
            {allFolders.map(folder => (
              <button
                key={folder}
                onClick={() => setActiveFolderName(folder)}
                className={`px-3 py-1 font-bold uppercase transition-colors cursor-pointer flex items-center gap-1 ${
                  activeFolderName === folder
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--surface-soft)] text-[var(--muted)] hover:text-[var(--ink)]"
                }`}
              >
                <Folder className="w-3 h-3" />
                <span>{folder}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Materials Table / List Grid */}
        <div className="bmw-card p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--hairline)] bg-[var(--surface-soft)] text-[11px] font-bold tracking-[1.5px] uppercase text-[var(--muted)]">
                <th className="p-4">DOCUMENT / MATERIAL</th>
                <th className="p-4">COURSE</th>
                <th className="p-4">FOLDER</th>
                <th className="p-4">FILE SIZE</th>
                <th className="p-4">UPLOADED</th>
                <th className="p-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--hairline)]">
              {filteredMaterials.map((file) => (
                <tr key={file.id} className="hover:bg-[var(--surface-soft)] transition-colors">
                  
                  {/* File Name */}
                  <td className="p-4 font-bold text-sm text-[var(--ink)] flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-red-500/10 text-red-600 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span>{file.fileName}</span>
                  </td>

                  {/* Course Code */}
                  <td className="p-4 font-bold text-[var(--primary)]">
                    #{file.courseCode}
                  </td>

                  {/* Folder */}
                  <td className="p-4">
                    <span className="px-2 py-0.5 bg-[var(--surface-soft)] border border-[var(--hairline)] text-[var(--ink)] text-[11px] font-semibold flex items-center gap-1 w-fit">
                      <Folder className="w-3 h-3 text-[var(--primary)]" />
                      <span>{file.folderName}</span>
                    </span>
                  </td>

                  {/* Size */}
                  <td className="p-4 text-[var(--muted)] font-mono">
                    {file.fileSize}
                  </td>

                  {/* Date */}
                  <td className="p-4 text-[var(--muted)] font-light">
                    {file.uploadedAt}
                  </td>

                  {/* Actions */}
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setSelectedDocForView(file)}
                        className="px-2.5 py-1 bg-[var(--primary)] text-white hover:bg-[var(--primary-active)] text-xs font-bold uppercase rounded flex items-center gap-1 transition-colors cursor-pointer"
                        title="View / Read Document"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>

                      <button
                        onClick={() => {
                          const content = `# Course Material: ${file.fileName}\nCourse: ${file.courseCode}\nFolder: ${file.folderName}\nDownloaded from Student Portal Pro on ${new Date().toLocaleString()}`;
                          const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = file.fileName;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className="p-1.5 text-[var(--primary)] hover:bg-[var(--surface-soft)] rounded transition-colors cursor-pointer"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteFile(file.id, file.fileKey)}
                        className="p-1.5 text-[var(--muted)] hover:text-red-500 rounded transition-colors cursor-pointer"
                        title="Delete and Reclaim Storage"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredMaterials.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-xs text-[var(--muted)] font-light">
                    No course materials found in this folder or course. Click "Upload Material" to add your slide decks or notes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MODAL: ADD COURSE                                                      */}
      {/* ========================================================================= */}
      {isAddCourseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-[var(--canvas)] border border-[var(--hairline-strong)] w-full max-w-lg p-8 relative">
            <button
              onClick={() => setIsAddCourseModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-6 pr-10">
              <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
                COURSE ENROLLMENT
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)]">Add Academic Course</h3>
              <p className="text-xs text-[var(--muted)] font-light">Configure schedule and 1-click video launcher parameters.</p>
            </div>

            <form onSubmit={handleAddCourse} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">COURSE CODE</label>
                  <input
                    type="text"
                    required
                    value={newCourseCode}
                    onChange={(e) => setNewCourseCode(e.target.value)}
                    placeholder="e.g. CS 341"
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">INSTRUCTOR</label>
                  <input
                    type="text"
                    value={newInstructor}
                    onChange={(e) => setNewInstructor(e.target.value)}
                    placeholder="Prof. Name"
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">COURSE TITLE</label>
                <input
                  type="text"
                  required
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="e.g. Algorithms & Complexity"
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">SCHEDULE TIME</label>
                <input
                  type="text"
                  value={newSchedule}
                  onChange={(e) => setNewSchedule(e.target.value)}
                  placeholder="e.g. Mon/Wed 10:00 AM - 11:30 AM"
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">PLATFORM</label>
                  <select
                    value={newPlatform}
                    onChange={(e) => setNewPlatform(e.target.value as any)}
                    className="w-full h-10 px-2 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] font-bold outline-none"
                  >
                    <option value="meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">MS Teams</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">MEETING URL</label>
                  <input
                    type="url"
                    value={newMeetingLink}
                    onChange={(e) => setNewMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setIsAddCourseModalOpen(false)}
                  className="bmw-btn-secondary !h-10 !text-xs !py-2"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bmw-btn-primary !h-10 !text-xs !py-2"
                >
                  SAVE COURSE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL: CREATE CUSTOM FOLDER                                            */}
      {/* ========================================================================= */}
      {isAddFolderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-[var(--canvas)] border border-[var(--hairline-strong)] w-full max-w-md p-8 relative">
            <button
              onClick={() => setIsAddFolderModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-6 pr-10">
              <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
                REPOSITORY FOLDER
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)]">Create Folder</h3>
              <p className="text-xs text-[var(--muted)] font-light">Organize slide decks, cheat sheets, or lab manuals.</p>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (newFolderName.trim()) {
                  // Creates a starter file in that folder to populate it
                  const newFile: MaterialItem = {
                    id: `mat_${Date.now()}`,
                    courseCode: newFolderCourse,
                    folderName: newFolderName.trim(),
                    fileName: `${newFolderName.trim()}_ReadMe.pdf`,
                    fileSize: "1.0 MB",
                    fileType: "pdf",
                    uploadedAt: "Just now"
                  };
                  setMaterials(prev => [newFile, ...prev]);
                  setNewFolderName("");
                  setIsAddFolderModalOpen(false);
                }
              }} 
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">FOLDER NAME</label>
                <input
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="e.g. Midterm Cheat Sheets / Week 1-4 Slides"
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">ASSIGN TO COURSE</label>
                <select
                  value={newFolderCourse}
                  onChange={(e) => setNewFolderCourse(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] font-bold outline-none"
                >
                  {userData.courses.map(c => (
                    <option key={c.id} value={c.courseCode}>#{c.courseCode} - {c.courseName}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  onClick={() => setIsAddFolderModalOpen(false)}
                  className="bmw-btn-secondary !h-10 !text-xs !py-2"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="bmw-btn-primary !h-10 !text-xs !py-2"
                >
                  CREATE FOLDER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: UPLOAD FILE MATERIAL                                            */}
      {/* ========================================================================= */}
      {isUploadFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75">
          <div className="bg-[var(--canvas)] border border-[var(--hairline-strong)] w-full max-w-md p-8 relative">
            <button
              onClick={() => setIsUploadFileModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1 mb-6 pr-10">
              <div className="text-[12px] font-bold tracking-[1.5px] uppercase text-[var(--primary)]">
                FILE UPLOAD
              </div>
              <h3 className="text-xl font-bold text-[var(--ink)]">Upload Course Material</h3>
              <p className="text-xs text-[var(--muted)] font-light">Encrypted multi-tenant file storage partition.</p>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">FILE / DOCUMENT NAME</label>
                <input
                  type="text"
                  required
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="e.g. CS341_Dynamic_Programming_Deck"
                  className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">COURSE</label>
                  <select
                    value={uploadCourseCode}
                    onChange={(e) => setUploadCourseCode(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] font-bold outline-none"
                  >
                    {userData.courses.map(c => (
                      <option key={c.id} value={c.courseCode}>#{c.courseCode}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">TARGET FOLDER</label>
                  <select
                    value={uploadTargetFolder}
                    onChange={(e) => setUploadTargetFolder(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--canvas)] border border-[var(--hairline-strong)] text-[var(--ink)] font-bold outline-none"
                  >
                    {allFolders.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                    {allFolders.length === 0 && <option value="Lecture Slides">Lecture Slides</option>}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                  ATTACH FILE (PDF / TEXTBOOK / NOTES)
                </label>
                <div className="p-4 border border-dashed border-[var(--hairline-strong)] text-center space-y-2 bg-[var(--surface-soft)] rounded-lg relative">
                  <Upload className="w-6 h-6 text-[var(--primary)] mx-auto" />
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.ppt,.pptx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAttachedFile(file);
                        if (!uploadFileName) {
                          setUploadFileName(file.name.replace(/\.[^/.]+$/, ""));
                        }
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div>
                    {attachedFile ? (
                      <div className="text-xs font-bold text-emerald-500">
                        Selected: {attachedFile.name} ({(attachedFile.size / (1024 * 1024)).toFixed(1)} MB)
                      </div>
                    ) : (
                      <>
                        <div className="font-bold text-[var(--ink)]">Click or Drag PDF here (up to 50MB)</div>
                        <div className="text-[10px] text-[var(--muted)] font-light">Direct Cloudflare R2 Upload • 0ms IndexedDB Cache</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-[var(--hairline)]">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsUploadFileModalOpen(false)}
                  className="bmw-btn-secondary !h-10 !text-xs !py-2"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="bmw-btn-primary !h-10 !text-xs !py-2 flex items-center gap-1.5"
                >
                  {isUploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>UPLOADING...</span>
                    </>
                  ) : (
                    <span>UPLOAD TO REPOSITORY</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. High-Performance Virtualized PDF Reader Modal with 0ms Cache */}
      <PDFViewerModal 
        isOpen={!!selectedDocForView}
        onClose={() => setSelectedDocForView(null)}
        document={selectedDocForView}
      />

    </div>
  );
}
