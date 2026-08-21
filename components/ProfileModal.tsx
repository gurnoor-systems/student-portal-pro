"use client";

import React, { useState } from "react";
import { useAuth, CourseItem } from "@/lib/auth-context";
import { 
  X, 
  User, 
  Lock, 
  BookOpen, 
  GraduationCap, 
  Plus, 
  Trash2, 
  Check, 
  RefreshCw, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck, 
  Mail, 
  Video, 
  Sparkles,
  AlertCircle,
  Calendar,
  Smartphone,
  Laptop,
  Tablet,
  Radio,
  LogOut,
  CheckCircle2
} from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POPULAR_DEGREES = [
  "B.Tech (Bachelor of Technology)",
  "B.Sc (Bachelor of Science)",
  "B.E. (Bachelor of Engineering)",
  "BBA (Bachelor of Business Admin)",
  "B.A. (Bachelor of Arts)",
  "M.S. / M.Sc (Master of Science)",
  "MBA (Master of Business Admin)",
  "Ph.D. (Doctorate)",
  "Other (Custom Degree / Program)..."
];

const SUGGESTED_NEXT_SEMESTERS = [
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Semester 5",
  "Semester 6",
  "Semester 7",
  "Semester 8",
  "Winter 2027",
  "Fall 2027",
  "Spring 2027"
];

export default function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { 
    user, 
    userData, 
    addCourse, 
    deleteCourse, 
    updateProfile, 
    changePassword, 
    sendPasswordResetEmail,
    resetPasswordWithCode,
    rolloverSemester,
    deleteAccount,
    revokeDeviceSession,
    revokeAllOtherDevices,
    refreshMultiDeviceSync
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"subjects" | "security" | "devices" | "profile">("subjects");
  const [deviceActionLoading, setDeviceActionLoading] = useState<string | null>(null);
  const [deviceSyncFeedback, setDeviceSyncFeedback] = useState<string | null>(null);

  // Delete Account Confirmation States
  const [isDeleteAccountOpen, setIsDeleteAccountOpen] = useState(false);
  const [deleteConfirmedCheckbox, setDeleteConfirmedCheckbox] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Profile fields state
  const isCustomDegreeInitial = !POPULAR_DEGREES.slice(0, -1).includes(user?.degree || "");
  const [fullName, setFullName] = useState(user?.fullName || "");
  const [university, setUniversity] = useState(user?.university || "");
  const [degreeSelect, setDegreeSelect] = useState(isCustomDegreeInitial ? "Other (Custom Degree / Program)..." : (user?.degree || "B.Tech (Bachelor of Technology)"));
  const [customDegree, setCustomDegree] = useState(isCustomDegreeInitial ? (user?.degree || "") : "");
  const [major, setMajor] = useState(user?.major || "");
  const [semester, setSemester] = useState(user?.semester || "");
  const [profileFeedback, setProfileFeedback] = useState<string | null>(null);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  
  // Forgot password & instant PIN recovery state
  const [isResetSending, setIsResetSending] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [recoveryNewPass, setRecoveryNewPass] = useState("");
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryFeedback, setRecoveryFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Subject management state
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [subjectCode, setSubjectCode] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [instructor, setInstructor] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");

  // Semester rollover state
  const [isRolloverOpen, setIsRolloverOpen] = useState(false);
  const [nextSemester, setNextSemester] = useState("Semester 4");
  const [clearOldSubjects, setClearOldSubjects] = useState(true);
  const [rolloverFeedback, setRolloverFeedback] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  if (!isOpen || !user) return null;

  // Handle Profile Update
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setProfileFeedback(null);
    
    const finalDegree = degreeSelect === "Other (Custom Degree / Program)..." 
      ? (customDegree.trim() || "Higher Education")
      : degreeSelect;

    const res = await updateProfile({
      fullName: fullName.trim(),
      university: university.trim(),
      degree: finalDegree,
      major: major.trim(),
      semester: semester.trim()
    });
    setLoading(false);
    if (res.success) {
      setProfileFeedback("Profile updated successfully!");
      setTimeout(() => setProfileFeedback(null), 3000);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordFeedback(null);

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ type: "error", text: "New password and confirmation do not match." });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordFeedback({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    const res = await changePassword(currentPassword, newPassword);
    setLoading(false);
    if (res.success) {
      setPasswordFeedback({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordFeedback({ type: "error", text: res.error || "Could not change password." });
    }
  };

  // Handle Send Forgot Password Reset Link + Instant PIN
  const handleSendResetEmail = async () => {
    setIsResetSending(true);
    setResetFeedback(null);
    setRecoveryFeedback(null);
    const res = await sendPasswordResetEmail(user.email);
    setIsResetSending(false);
    if (res.success) {
      if (res.resetCode) {
        setRecoveryCode(res.resetCode);
        setEnteredCode(res.resetCode);
      }
      setResetFeedback(`Password recovery dispatched to ${user.email}. Check your email or use the instant recovery code below.`);
    } else {
      setResetFeedback(res.error || "Could not dispatch recovery link.");
    }
  };

  // Handle Reset With Code
  const handleResetWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enteredCode || !recoveryNewPass) return;
    setRecoveryLoading(true);
    setRecoveryFeedback(null);
    const res = await resetPasswordWithCode(user.email, enteredCode, recoveryNewPass);
    setRecoveryLoading(false);
    if (res.success) {
      setRecoveryFeedback({ type: "success", text: "Password successfully reset! You can now sign in with your new password." });
      setRecoveryNewPass("");
      setRecoveryCode(null);
    } else {
      setRecoveryFeedback({ type: "error", text: res.error || "Could not reset password. Invalid code." });
    }
  };

  // Handle Add New Subject (Subject Code is Optional)
  const handleAddNewSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectName.trim()) return;

    // Generate fallback acronym code if left blank
    const fallbackCode = subjectCode.trim() 
      ? subjectCode.trim().toUpperCase() 
      : (subjectName.trim().split(/\s+/).map(w => w[0]).join("").slice(0, 4).toUpperCase() || "SUB");

    addCourse({
      courseCode: fallbackCode,
      courseName: subjectName.trim(),
      instructor: instructor.trim() || "Faculty Professor",
      meetingLink: meetingLink.trim() || `https://meet.google.com/${fallbackCode.toLowerCase()}`,
      meetingPlatform: "meet",
      scheduleTime: scheduleTime.trim() || "Schedule TBA"
    });

    setSubjectCode("");
    setSubjectName("");
    setInstructor("");
    setMeetingLink("");
    setScheduleTime("");
    setIsAddSubjectOpen(false);
  };

  // Handle Semester Rollover
  const handleExecuteRollover = async () => {
    setLoading(true);
    setRolloverFeedback(null);
    const res = await rolloverSemester(nextSemester, clearOldSubjects);
    setLoading(false);
    if (res.success) {
      setSemester(nextSemester);
      setRolloverFeedback(`Transitioned to ${nextSemester}! Academic schedule prepared.`);
      setTimeout(() => {
        setIsRolloverOpen(false);
        setRolloverFeedback(null);
      }, 2000);
    }
  };

  // Handle Revoke Remote Device Session
  const handleRevokeDevice = async (deviceIdToRevoke: string) => {
    setDeviceActionLoading(deviceIdToRevoke);
    await revokeDeviceSession(deviceIdToRevoke);
    setDeviceActionLoading(null);
  };

  // Handle Revoke All Other Devices
  const handleRevokeAllOtherDevices = async () => {
    setDeviceActionLoading("all_other");
    await revokeAllOtherDevices();
    setDeviceActionLoading(null);
  };

  // Handle Manual Live Sync
  const handleManualSync = async () => {
    setDeviceActionLoading("sync");
    await refreshMultiDeviceSync();
    setDeviceSyncFeedback("Synced with cloud & active devices just now!");
    setDeviceActionLoading(null);
    setTimeout(() => setDeviceSyncFeedback(null), 2500);
  };

  // Handle Delete Account
  const handleDeleteAccount = async () => {
    if (!deleteConfirmedCheckbox) return;
    setIsDeletingAccount(true);
    await deleteAccount();
    setIsDeletingAccount(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="bg-[#0f141c] border border-white/15 text-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        role="dialog"
        aria-modal="true"
      >
        
        {/* Modal Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--primary)] text-white font-bold flex items-center justify-center rounded-xl text-sm shadow-md">
              {user.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white leading-none">{user.fullName}</h2>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold rounded">
                  VERIFIED
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-1">
                {user.university} • {user.degree ? user.degree.split(" ")[0] : "Student"} • {user.semester}
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#090d12] px-4 sm:px-6 text-xs font-bold uppercase tracking-wider overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("subjects")}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === "subjects"
                ? "border-[var(--primary)] text-[var(--primary)] font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Subjects ({userData.courses.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === "security"
                ? "border-[var(--primary)] text-[var(--primary)] font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Password & Security</span>
          </button>

          <button
            onClick={() => setActiveTab("devices")}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === "devices"
                ? "border-[var(--primary)] text-[var(--primary)] font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-4 h-4 text-[var(--primary)]" />
            <span>Connected Devices</span>
            {user.activeSessions && user.activeSessions.length > 0 && (
              <span className="px-1.5 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] text-[10px] font-mono rounded-full font-bold">
                {user.activeSessions.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`py-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
              activeTab === "profile"
                ? "border-[var(--primary)] text-[var(--primary)] font-bold"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Academic Info</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* TAB 1: SUBJECTS & SEMESTER LIFECYCLE */}
          {activeTab === "subjects" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Active Semester Banner */}
              <div className="p-4 bg-[#141b24] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase text-[#d4af37] font-bold">
                    ACTIVE SEMESTER ENROLLMENT
                  </div>
                  <div className="text-sm font-bold text-white">
                    {user.semester} • {user.degree}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Add new subjects for this semester or transition to the next semester when your term ends.
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsRolloverOpen(!isRolloverOpen)}
                    className="px-3 py-2 bg-[#1d2633] hover:bg-[#273447] text-white border border-white/15 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Next Semester</span>
                  </button>

                  <button
                    onClick={() => setIsAddSubjectOpen(true)}
                    className="px-3 py-2 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Subject</span>
                  </button>
                </div>
              </div>

              {/* Semester Rollover Wizard Drawer */}
              {isRolloverOpen && (
                <div className="p-4 bg-[#131d2b] border border-[#d4af37]/40 rounded-xl space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h4 className="text-xs font-bold text-[#d4af37] uppercase tracking-wider flex items-center gap-2">
                      <GraduationCap className="w-4 h-4" />
                      <span>Promote to Next Semester</span>
                    </h4>
                    <button onClick={() => setIsRolloverOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <p className="text-[11px] text-slate-300">
                    Degree remains unchanged (<span className="text-white font-bold">{user.degree}</span>). Choose your new semester to update your courses.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">SELECT NEXT SEMESTER</label>
                      <select
                        value={nextSemester}
                        onChange={(e) => setNextSemester(e.target.value)}
                        className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white font-bold rounded-lg outline-none"
                      >
                        {SUGGESTED_NEXT_SEMESTERS.map((sem, sIdx) => (
                          <option key={sIdx} value={sem}>{sem}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-slate-300 text-xs">
                        <input
                          type="checkbox"
                          checked={clearOldSubjects}
                          onChange={(e) => setClearOldSubjects(e.target.checked)}
                          className="w-4 h-4 rounded text-[var(--primary)]"
                        />
                        <span>Clear previous semester subjects for clean slate</span>
                      </label>
                    </div>
                  </div>

                  {rolloverFeedback && (
                    <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] rounded">
                      {rolloverFeedback}
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setIsRolloverOpen(false)}
                      className="px-3 py-1.5 border border-white/10 text-slate-400 hover:text-white rounded text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleExecuteRollover}
                      disabled={loading}
                      className="px-4 py-1.5 bg-[#d4af37] hover:bg-[#b8952b] text-slate-950 font-bold uppercase rounded text-xs cursor-pointer transition-colors"
                    >
                      Confirm Transition
                    </button>
                  </div>
                </div>
              )}

              {/* Add Subject Modal / Form */}
              {isAddSubjectOpen && (
                <form onSubmit={handleAddNewSubject} className="p-4 bg-[#090d12] border border-white/15 rounded-xl space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="font-bold text-white text-xs uppercase tracking-wider">Add New Course / Subject</span>
                    <button type="button" onClick={() => setIsAddSubjectOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">
                        SUBJECT CODE <span className="text-[9px] text-slate-500 lowercase">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={subjectCode}
                        onChange={(e) => setSubjectCode(e.target.value)}
                        placeholder="e.g. CS 452 (Optional)"
                        className="w-full h-10 px-3 bg-[#141b24] border border-white/15 text-white font-mono uppercase rounded-lg outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">SUBJECT / COURSE NAME</label>
                      <input
                        type="text"
                        required
                        value={subjectName}
                        onChange={(e) => setSubjectName(e.target.value)}
                        placeholder="e.g. Real-Time Embedded Systems"
                        className="w-full h-10 px-3 bg-[#141b24] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">INSTRUCTOR / PROFESSOR</label>
                      <input
                        type="text"
                        value={instructor}
                        onChange={(e) => setInstructor(e.target.value)}
                        placeholder="e.g. Dr. Jennifer Vance"
                        className="w-full h-10 px-3 bg-[#141b24] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">SCHEDULE / TIME</label>
                      <input
                        type="text"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        placeholder="e.g. Tue/Thu 1:30 PM - 3:00 PM"
                        className="w-full h-10 px-3 bg-[#141b24] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">LECTURE MEETING LINK (GOOGLE MEET / ZOOM)</label>
                    <input
                      type="url"
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      placeholder="https://meet.google.com/xyz-abcd-efg"
                      className="w-full h-10 px-3 bg-[#141b24] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddSubjectOpen(false)}
                      className="px-3 py-1.5 border border-white/10 text-slate-400 hover:text-white rounded text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white font-bold uppercase rounded text-xs cursor-pointer transition-colors"
                    >
                      Save Subject
                    </button>
                  </div>
                </form>
              )}

              {/* Subject Grid List */}
              <div className="space-y-2">
                <div className="text-[10px] font-mono uppercase text-slate-400">ENROLLED COURSES ({userData.courses.length})</div>

                {userData.courses.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {userData.courses.map(course => (
                      <div key={course.id} className="p-3.5 bg-[#141b24] border border-white/10 rounded-xl space-y-2 relative group hover:border-[var(--primary)]/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-[var(--primary)]/20 text-[var(--primary)] rounded">
                            {course.courseCode}
                          </span>
                          <button
                            onClick={() => deleteCourse(course.id)}
                            className="text-slate-400 hover:text-red-400 p-1 transition-colors cursor-pointer"
                            title="Remove Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div>
                          <div className="text-xs font-bold text-white truncate">{course.courseName}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{course.instructor} • {course.scheduleTime}</div>
                        </div>

                        {course.meetingLink && (
                          <a
                            href={course.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-mono text-[var(--primary)] hover:underline flex items-center gap-1 pt-1 border-t border-white/10"
                          >
                            <Video className="w-3 h-3" />
                            <span>Lecture Room Link</span>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center bg-[#141b24] border border-white/10 rounded-xl space-y-2">
                    <BookOpen className="w-6 h-6 text-slate-500 mx-auto" />
                    <div className="text-xs font-bold text-white">No Subjects Enrolled for {user.semester}</div>
                    <p className="text-[11px] text-slate-400">Click &quot;+ Add Subject&quot; above to add your semester course schedule.</p>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: PASSWORD & SECURITY */}
          {activeTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Change Password Form */}
              <form onSubmit={handleChangePassword} className="p-4 bg-[#141b24] border border-white/10 rounded-xl space-y-3.5">
                <div className="space-y-0.5 border-b border-white/10 pb-2.5">
                  <div className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[var(--primary)]" />
                    <span>Change Account Password</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Enter your current password and a new 6+ character password.</div>
                </div>

                {passwordFeedback && (
                  <div className={`p-2.5 rounded text-[11px] font-mono ${
                    passwordFeedback.type === "success" 
                      ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                      : "bg-red-500/15 border border-red-500/30 text-red-300"
                  }`}>
                    {passwordFeedback.text}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">CURRENT PASSWORD</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">NEW PASSWORD (6+ CHARS)</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">CONFIRM NEW PASSWORD</label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  {loading ? "UPDATING PASSWORD..." : "UPDATE PASSWORD"}
                </button>
              </form>

              {/* Forgot Password / Instant PIN Recovery Box */}
              <div className="p-4 bg-[#141b24] border border-white/10 rounded-xl space-y-3.5">
                <div className="flex items-center gap-2 font-bold text-white text-xs uppercase tracking-wider">
                  <Mail className="w-4 h-4 text-[#4285F4]" />
                  <span>Forgot Password Recovery & Instant PIN</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Dispatch an encrypted reset link or generate an instant 6-digit recovery code for <span className="text-white font-mono font-bold">{user.email}</span>.
                </p>

                {resetFeedback && (
                  <div className="p-2.5 bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-[11px] rounded space-y-1">
                    <div>{resetFeedback}</div>
                  </div>
                )}

                {recoveryCode && (
                  <div className="p-3.5 bg-[#090d12] border border-[#d4af37]/40 rounded-xl space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">1-TIME INSTANT RECOVERY CODE:</span>
                      <span className="px-3 py-1 bg-[#d4af37]/20 border border-[#d4af37]/50 text-[#d4af37] font-mono font-bold text-sm tracking-[4px] rounded">
                        {recoveryCode}
                      </span>
                    </div>

                    <form onSubmit={handleResetWithCode} className="space-y-2.5 pt-2 border-t border-white/10">
                      {recoveryFeedback && (
                        <div className={`p-2 rounded text-[10px] font-mono ${
                          recoveryFeedback.type === "success" 
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300"
                            : "bg-red-500/15 border border-red-500/30 text-red-300"
                        }`}>
                          {recoveryFeedback.text}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={enteredCode}
                          onChange={(e) => setEnteredCode(e.target.value)}
                          placeholder="6-Digit Recovery Code"
                          className="w-full h-9 px-3 bg-[#141b24] border border-white/15 text-white font-mono text-xs rounded-lg outline-none focus:border-[#d4af37]"
                          required
                        />
                        <input
                          type="password"
                          value={recoveryNewPass}
                          onChange={(e) => setRecoveryNewPass(e.target.value)}
                          placeholder="New Password (6+ chars)"
                          className="w-full h-9 px-3 bg-[#141b24] border border-white/15 text-white text-xs rounded-lg outline-none focus:border-[#d4af37]"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={recoveryLoading}
                        className="w-full py-2 bg-[#d4af37] hover:bg-[#b8952b] text-slate-950 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        {recoveryLoading ? "VERIFYING & RESETTING..." : "CONFIRM CODE & RESET PASSWORD"}
                      </button>
                    </form>
                  </div>
                )}

                {!recoveryCode && (
                  <button
                    type="button"
                    onClick={handleSendResetEmail}
                    disabled={isResetSending}
                    className="px-4 py-2 bg-[#1a2330] hover:bg-[#222e40] border border-white/15 text-white font-bold uppercase text-[11px] rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#4285F4]" />
                    <span>{isResetSending ? "DISPATCHING RECOVERY CODE..." : "SEND PASSWORD RESET LINK / INSTANT PIN"}</span>
                  </button>
                )}
              </div>

              {/* DANGER ZONE: PERMANENTLY REMOVE / DELETE ACCOUNT */}
              <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span>Danger Zone • Delete Student Account</span>
                  </div>
                  {!isDeleteAccountOpen && (
                    <button
                      type="button"
                      onClick={() => setIsDeleteAccountOpen(true)}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer"
                    >
                      Remove Account
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Permanently purge your student profile, enrolled subjects, tasks, syllabus extractions, and session records directly from the database.
                </p>

                {isDeleteAccountOpen && (
                  <div className="p-4 bg-[#0c0809] border border-red-500/50 rounded-xl space-y-3.5 animate-in fade-in">
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Warning: Irreversible Database Purge</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-light leading-relaxed">
                        This will immediately clear your account (<span className="font-mono text-white font-bold">{user.email}</span>), all enrolled subjects, deliverables, exam schedules, and active multi-device sessions from the database.
                      </p>
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer text-slate-200 text-xs">
                      <input
                        type="checkbox"
                        checked={deleteConfirmedCheckbox}
                        onChange={(e) => setDeleteConfirmedCheckbox(e.target.checked)}
                        className="w-4 h-4 rounded text-red-600 mt-0.5"
                      />
                      <span className="leading-snug">
                        I understand that this action is permanent and it will delete my account.
                      </span>
                    </label>

                    <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                      <button
                        type="button"
                        onClick={() => { setIsDeleteAccountOpen(false); setDeleteConfirmedCheckbox(false); }}
                        className="px-3 py-1.5 border border-white/10 text-slate-400 hover:text-white rounded text-xs cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleDeleteAccount}
                        disabled={!deleteConfirmedCheckbox || isDeletingAccount}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold uppercase rounded text-xs cursor-pointer transition-colors flex items-center gap-2 shadow-lg shadow-red-600/30"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isDeletingAccount ? "PURGING FROM DATABASE..." : "PERMANENTLY DELETE ACCOUNT"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: CONNECTED DEVICES & CONCURRENT SESSIONS */}
          {activeTab === "devices" && (
            <div className="space-y-6 animate-in fade-in duration-150">
              
              {/* Header & Live Sync Controls */}
              <div className="p-4 bg-[#141b24] border border-white/10 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase text-[var(--primary)] font-bold flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span>CONCURRENT MULTI-DEVICE SESSIONS</span>
                  </div>
                  <div className="text-sm font-bold text-white">
                    Logged in on {(user.activeSessions && user.activeSessions.length) || 1} Device{((user.activeSessions && user.activeSessions.length) || 1) > 1 ? "s" : ""}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    You can access your portal simultaneously on your phone, laptop, iPad, and desktop with live 2-way data sync.
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={handleManualSync}
                    disabled={deviceActionLoading === "sync"}
                    className="px-3 py-2 bg-[#1d2633] hover:bg-[#273447] text-white border border-white/15 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-[var(--primary)] ${deviceActionLoading === "sync" ? "animate-spin" : ""}`} />
                    <span>{deviceActionLoading === "sync" ? "Syncing..." : "Sync Now"}</span>
                  </button>

                  {user.activeSessions && user.activeSessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllOtherDevices}
                      disabled={deviceActionLoading === "all_other"}
                      className="px-3 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold uppercase rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{deviceActionLoading === "all_other" ? "Revoking..." : "Sign Out Others"}</span>
                    </button>
                  )}
                </div>
              </div>

              {deviceSyncFeedback && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>{deviceSyncFeedback}</span>
                </div>
              )}

              {/* Active Devices List */}
              <div className="space-y-3">
                <div className="text-[11px] font-mono text-slate-400 uppercase font-bold tracking-wider">
                  ACTIVE SIGNED-IN DEVICES
                </div>

                <div className="space-y-2.5">
                  {(user.activeSessions && user.activeSessions.length > 0 ? user.activeSessions : [
                    {
                      deviceId: "current_device",
                      deviceName: "Current Device",
                      deviceType: "desktop" as const,
                      browser: "Chrome",
                      os: "Desktop",
                      loginTimestamp: new Date().toISOString(),
                      lastActiveTimestamp: new Date().toISOString(),
                      isCurrentDevice: true
                    }
                  ]).map((session, sIdx) => {
                    const isCurrent = session.isCurrentDevice ?? (sIdx === 0);
                    return (
                      <div 
                        key={session.deviceId || sIdx}
                        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isCurrent 
                            ? "bg-[#101722] border-[var(--primary)]/50 shadow-sm" 
                            : "bg-[#090d12] border-white/10 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            session.deviceType === "mobile"
                              ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                              : session.deviceType === "tablet"
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-400"
                                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          }`}>
                            {session.deviceType === "mobile" ? (
                              <Smartphone className="w-5 h-5" />
                            ) : session.deviceType === "tablet" ? (
                              <Tablet className="w-5 h-5" />
                            ) : (
                              <Laptop className="w-5 h-5" />
                            )}
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-xs">{session.deviceName}</span>
                              {isCurrent ? (
                                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono font-bold rounded flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  ACTIVE (THIS DEVICE)
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 bg-white/10 text-slate-300 text-[9px] font-mono rounded">
                                  CONNECTED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-slate-400 flex flex-wrap items-center gap-x-2">
                              <span>Logged in: {new Date(session.loginTimestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                              {session.ipAddress && session.ipAddress !== "127.0.0.1" && (
                                <span>• IP: {session.ipAddress}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {!isCurrent && (
                          <button
                            onClick={() => handleRevokeDevice(session.deviceId)}
                            disabled={deviceActionLoading === session.deviceId}
                            className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-white/10 hover:border-red-500/30 text-[11px] font-bold uppercase rounded-lg transition-colors cursor-pointer self-end sm:self-center"
                          >
                            {deviceActionLoading === session.deviceId ? "Signing Out..." : "Sign Out Device"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Real-time sync guarantee box */}
              <div className="p-4 bg-[#090d12] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Multi-Device State Lock-Step</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Your tasks, syllabus deliverables, focus stats, and courses are synchronized in the background across all active sessions. Adding a task on your phone instantly reflects on your desktop without requiring manual logouts or tab refreshes.
                </p>
              </div>

            </div>
          )}

          {/* TAB 4: ACADEMIC PROFILE INFO */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-in fade-in duration-150">
              {profileFeedback && (
                <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-xs rounded-xl">
                  {profileFeedback}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">FULL NAME</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">UNIVERSITY / CAMPUS</label>
                  <input
                    type="text"
                    required
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">DEGREE / PROGRAM</label>
                  <select
                    value={degreeSelect}
                    onChange={(e) => setDegreeSelect(e.target.value)}
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)] font-medium"
                  >
                    {POPULAR_DEGREES.map((deg, dIdx) => (
                      <option key={dIdx} value={deg}>{deg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {degreeSelect === "Other (Custom Degree / Program)..." && (
                <div className="animate-in fade-in">
                  <label className="block text-[10px] font-mono uppercase text-[#d4af37] mb-1">
                    ENTER CUSTOM DEGREE / PROGRAM NAME
                  </label>
                  <input
                    type="text"
                    required
                    value={customDegree}
                    onChange={(e) => setCustomDegree(e.target.value)}
                    placeholder="e.g. B.S. in Applied Artificial Intelligence, Diploma in Animation..."
                    className="w-full h-10 px-3 bg-[#090d12] border border-[#d4af37]/50 text-white rounded-lg outline-none focus:border-[#d4af37]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">MAJOR / SPECIALIZATION</label>
                  <input
                    type="text"
                    required
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1">CURRENT ACTIVE SEMESTER</label>
                  <input
                    type="text"
                    required
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-white rounded-lg outline-none focus:border-[var(--primary)]"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase rounded-lg transition-colors cursor-pointer shadow-sm"
                >
                  {loading ? "SAVING PROFILE..." : "SAVE ACADEMIC PROFILE"}
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
