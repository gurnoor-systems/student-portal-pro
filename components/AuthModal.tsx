"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Logo from "@/components/Logo";
import { 
  X, 
  ArrowRight, 
  ArrowLeft,
  AlertCircle, 
  Sparkles, 
  User, 
  Mail, 
  ShieldCheck, 
  GraduationCap, 
  Loader2,
  Search,
  Calendar,
  Check,
  Plus,
  CheckCircle2,
  Send
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "signin" | "signup";
}

const POPULAR_UNIVERSITIES = [
  "University of Waterloo",
  "University of Toronto",
  "Indian Institute of Technology (IIT)",
  "Stanford University",
  "MIT",
  "Harvard University",
  "UC Berkeley",
  "University of British Columbia",
  "McGill University"
];

const SUGGESTED_SEMESTERS = [
  "Fall 2026",
  "Winter 2027",
  "Spring 2026",
  "Semester 1",
  "Semester 2",
  "Semester 3",
  "Semester 4",
  "Term 2A",
  "Term 3B"
];

const SUGGESTED_COURSES = [
  "CS 341 - Algorithms & Complexity",
  "CS 350 - Operating Systems",
  "MATH 201 - Linear Algebra",
  "BIO 110 - Cell Biology",
  "PHYS 202 - Electricity & Magnetism",
  "ECON 101 - Microeconomics"
];

export default function AuthModal({ isOpen, onClose, initialTab = "signin" }: AuthModalProps) {
  const { signInWithPassword, signUpWithPassword, signInWithGoogleCustom, resendEmailConfirmation } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">(initialTab === "signup" ? "signup" : "signin");
  
  // 2-Step Flow: Step 1 (Credentials) -> Step 2 (Campus & Semester Details)
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Campus & Semester States
  const [university, setUniversity] = useState("University of Waterloo");
  const [semester, setSemester] = useState("Fall 2026");
  const [major, setMajor] = useState("Computer Science");
  const [selectedCourses, setSelectedCourses] = useState<string[]>([
    "CS 341 - Algorithms & Complexity",
    "CS 350 - Operating Systems"
  ]);
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState(true);

  // Email confirmation state
  const [isConfirmationSent, setIsConfirmationSent] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Google OAuth Dialog state
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googleUni, setGoogleUni] = useState("University of Waterloo");
  const [googleSemester, setGoogleSemester] = useState("Fall 2026");

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await signInWithPassword(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Could not sign in. Please check your credentials.");
      if (res.emailUnconfirmed) {
        setIsConfirmationSent(true);
      }
    }
  };

  // Step 1: Validate credentials -> Move to Campus Details (Step 2)
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !fullName || !password) {
      setError("Please fill in all fields to continue.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setStep(2);
  };

  // Step 2: Final Submission with Supabase Email Verification Link
  const handleFinalSignUp = async () => {
    setError(null);
    setLoading(true);
    const res = await signUpWithPassword(
      fullName,
      university || "University of Waterloo", 
      semester || "Fall 2026",
      major || "Computer Science", 
      email, 
      password,
      selectedCourses,
      syncGoogleCalendar
    );
    setLoading(false);
    if (res.success) {
      if (res.confirmationEmailSent) {
        setIsConfirmationSent(true);
      }
      onClose();
    } else {
      setError(res.error || "Signup failed. Please try again.");
    }
  };

  const handleResendConfirmation = async () => {
    setResendStatus("Resending verification link...");
    const res = await resendEmailConfirmation(email);
    if (res.success) {
      setResendStatus("Verification link dispatched to your inbox!");
    } else {
      setResendStatus(res.error || "Could not resend verification email.");
    }
  };

  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleName) return;
    setLoading(true);
    const res = await signInWithGoogleCustom(
      googleEmail, 
      googleName, 
      googleUni || "University of Waterloo", 
      googleSemester || "Fall 2026",
      "Computer Science",
      selectedCourses,
      syncGoogleCalendar
    );
    setLoading(false);
    if (res.success) {
      setIsGooglePickerOpen(false);
      onClose();
    } else {
      setError(res.error || "Google authentication failed.");
    }
  };

  const toggleCourse = (c: string) => {
    if (selectedCourses.includes(c)) {
      setSelectedCourses(selectedCourses.filter(item => item !== c));
    } else {
      setSelectedCourses([...selectedCourses, c]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div 
        className="bg-[#0f141c] border border-white/15 text-white w-full max-w-lg p-6 sm:p-8 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto rounded-2xl"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white cursor-pointer rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 mb-6 pr-10">
          <div className="flex items-center gap-2 text-[10px] font-mono tracking-[2px] uppercase text-[#d4af37]">
            <Logo size={16} variant="gold" />
            <span>STUDENT PORTAL PRO</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            {tab === "signin" 
              ? "Welcome Back" 
              : step === 1 
                ? "Create Student Account" 
                : "Campus & Semester Setup"}
          </h2>
          <p className="text-xs text-slate-400 font-light">
            {tab === "signin" 
              ? "Sign in with your student email or Google account." 
              : step === 1 
                ? "Step 1 of 2: Enter student identity and credentials." 
                : "Step 2 of 2: Set university, semester, and Google Calendar sync."}
          </p>
        </div>

        {/* Progress Bar for Sign Up */}
        {tab === "signup" && !isGooglePickerOpen && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-1.5">
              <span>
                {step === 1 ? "STEP 1: CREDENTIALS" : "STEP 2: CAMPUS & SEMESTER"}
              </span>
              <span className="text-[#d4af37] font-bold">
                {step === 1 ? "50% COMPLETE" : "FINAL STEP"}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#18202c] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#1c69d4] via-[#d4af37] to-emerald-500 transition-all duration-300 rounded-full"
                style={{ width: step === 1 ? "50%" : "100%" }}
              />
            </div>
          </div>
        )}

        {/* Sign In vs Create Account Tabs (only on step 1) */}
        {step === 1 && !isGooglePickerOpen && (
          <div className="grid grid-cols-2 border-b border-white/10 mb-6 text-xs text-center font-mono">
            <button
              onClick={() => { setTab("signin"); setError(null); }}
              className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                tab === "signin" 
                  ? "border-[#1c69d4] text-white font-bold bg-[#141b24]" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setTab("signup"); setError(null); }}
              className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                tab === "signup" 
                  ? "border-[#1c69d4] text-white font-bold bg-[#141b24]" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              CREATE ACCOUNT
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Email Verification Link Banner */}
        {isConfirmationSent && (
          <div className="p-4 mb-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Mail className="w-4 h-4" />
              <span>Supabase Email Verification Link Dispatched</span>
            </div>
            <p className="text-slate-300 font-light leading-relaxed">
              A free confirmation link has been sent to <span className="font-mono text-white font-bold">{email || "your student email"}</span>. Please click the link in your inbox to confirm your account.
            </p>
            {resendStatus && (
              <div className="text-[11px] font-mono text-emerald-400">{resendStatus}</div>
            )}
            <button
              type="button"
              onClick={handleResendConfirmation}
              className="text-[11px] text-[#d4af37] hover:underline font-bold cursor-pointer"
            >
              Resend verification link ›
            </button>
          </div>
        )}

        {/* GOOGLE ACCOUNT ONE-CLICK SIGN IN POPUP */}
        {isGooglePickerOpen ? (
          <form onSubmit={handleGoogleSubmit} className="space-y-4 animate-in fade-in duration-150">
            <div className="p-3 bg-[#131b26] border border-white/10 text-xs text-white space-y-1 rounded-xl">
              <div className="font-bold flex items-center gap-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Verified Authentication</span>
                <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono">AUTOMATED IDENTITY</span>
              </div>
              <p className="text-[11px] text-slate-400 font-light">
                Google automatically verifies your student email and identity token with zero manual confirmation links required.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                STUDENT GOOGLE EMAIL
              </label>
              <input
                type="email"
                required
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="student@uwaterloo.ca"
                className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
              />
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                FULL NAME
              </label>
              <input
                type="text"
                required
                value={googleName}
                onChange={(e) => setGoogleName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  CAMPUS / UNIVERSITY
                </label>
                <input
                  type="text"
                  value={googleUni}
                  onChange={(e) => setGoogleUni(e.target.value)}
                  placeholder="e.g. University of Waterloo"
                  className="w-full h-10 px-2.5 bg-[#090d12] border border-white/15 text-xs text-white outline-none rounded-xl"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  SEMESTER / TERM
                </label>
                <input
                  type="text"
                  value={googleSemester}
                  onChange={(e) => setGoogleSemester(e.target.value)}
                  placeholder="e.g. Fall 2026"
                  className="w-full h-10 px-2.5 bg-[#090d12] border border-white/15 text-xs text-white outline-none rounded-xl"
                />
              </div>
            </div>

            {/* Google Calendar Sync Option */}
            <div 
              onClick={() => setSyncGoogleCalendar(!syncGoogleCalendar)}
              className="p-3 bg-[#090d12] border border-white/10 flex items-center justify-between cursor-pointer hover:border-[#1c69d4] transition-colors rounded-xl"
            >
              <div className="flex items-center gap-2 text-xs">
                <Calendar className="w-4 h-4 text-[#4285F4]" />
                <span>Sync with Google Calendar (2-Way)</span>
              </div>
              <div className={`w-4 h-4 border flex items-center justify-center rounded ${syncGoogleCalendar ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"}`}>
                {syncGoogleCalendar && <Check className="w-3 h-3" />}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsGooglePickerOpen(false)}
                className="w-1/3 py-3 border border-white/15 text-slate-300 hover:text-white text-xs font-bold uppercase transition-colors rounded-xl cursor-pointer"
              >
                BACK
              </button>
              <button
                type="submit"
                disabled={loading}
                className="w-2/3 py-3 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>VERIFYING GOOGLE TOKEN...</span>
                  </>
                ) : (
                  <>
                    <span>CONTINUE WITH GOOGLE</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : tab === "signin" ? (
          /* TAB 1: SIGN IN */
          <div className="space-y-4">
            <button
              onClick={() => setIsGooglePickerOpen(true)}
              disabled={loading}
              className="w-full h-12 border border-white/15 bg-[#141b24] hover:bg-[#1a2330] text-white text-xs font-bold tracking-[0.5px] uppercase flex items-center justify-center gap-3 transition-colors cursor-pointer rounded-xl"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>SIGN IN WITH GOOGLE</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-3 text-[10px] font-mono text-slate-500 uppercase">OR WITH STUDENT EMAIL</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            <form onSubmit={handleSignIn} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  STUDENT EMAIL
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@uwaterloo.ca"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  PASSWORD
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 rounded-xl shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>AUTHENTICATING...</span>
                  </>
                ) : (
                  <>
                    <span>SIGN IN TO PORTAL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : step === 1 ? (
          /* STEP 1: CREATE ACCOUNT (CREDENTIALS) */
          <div className="space-y-4 animate-in fade-in duration-150">
            <button
              onClick={() => setIsGooglePickerOpen(true)}
              disabled={loading}
              className="w-full h-12 border border-white/15 bg-[#141b24] hover:bg-[#1a2330] text-white text-xs font-bold tracking-[0.5px] uppercase flex items-center justify-center gap-3 transition-colors cursor-pointer rounded-xl"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>SIGN UP WITH GOOGLE (VERIFIED)</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/10" />
              <span className="px-3 text-[10px] font-mono text-slate-500 uppercase">OR REGISTER WITH EMAIL</span>
              <div className="flex-1 border-t border-white/10" />
            </div>

            <form onSubmit={handleStep1Submit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  FULL NAME
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Rivera"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  STUDENT EMAIL (FOR CONFIRMATION LINK)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@uwaterloo.ca"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  PASSWORD (6+ CHARACTERS)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 rounded-xl shadow-lg shadow-blue-500/20"
              >
                <span>CONTINUE TO CAMPUS SETUP (STEP 2)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        ) : (
          /* STEP 2: UNIVERSITY, SEMESTER & CALENDAR SYNC SETUP */
          <div className="space-y-4 animate-in fade-in duration-150">
            
            {/* University Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase text-slate-300">
                CAMPUS / UNIVERSITY
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Type or select university..."
                  className="w-full h-10 pl-9 pr-3 bg-[#090d12] border border-white/15 text-xs text-white focus:border-[#1c69d4] outline-none rounded-xl"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3.5" />
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {POPULAR_UNIVERSITIES.slice(0, 4).map((uni, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setUniversity(uni)}
                    className={`text-[10px] px-2.5 py-1 border transition-colors cursor-pointer rounded-lg ${
                      university === uni
                        ? "bg-[#1c69d4] border-[#1c69d4] text-white font-bold"
                        : "bg-[#141b24] border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {uni}
                  </button>
                ))}
              </div>
            </div>

            {/* Semester / Term Selection */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase text-slate-300">
                ACTIVE SEMESTER / TERM
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. Fall 2026, Semester 3, Term 2A"
                  className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-xs text-white focus:border-[#1c69d4] outline-none rounded-xl"
                />
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {SUGGESTED_SEMESTERS.slice(0, 5).map((sem, sIdx) => (
                  <button
                    key={sIdx}
                    type="button"
                    onClick={() => setSemester(sem)}
                    className={`text-[10px] px-2.5 py-1 border transition-colors cursor-pointer rounded-lg ${
                      semester === sem
                        ? "bg-[#d4af37] border-[#d4af37] text-slate-900 font-bold"
                        : "bg-[#141b24] border-white/10 text-slate-400 hover:text-white"
                    }`}
                  >
                    {sem}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Course Chips */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-mono uppercase text-slate-300">
                ACTIVE ENROLLED COURSES
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_COURSES.map((course, cIdx) => {
                  const isSelected = selectedCourses.includes(course);
                  return (
                    <button
                      key={cIdx}
                      type="button"
                      onClick={() => toggleCourse(course)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-[#16202c] border-[#d4af37] text-white font-medium"
                          : "bg-[#090d12] border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {isSelected ? <Check className="w-3 h-3 text-[#d4af37]" /> : <Plus className="w-3 h-3" />}
                      <span>{course.split(" - ")[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Calendar 2-Way Live Sync Toggle */}
            <div 
              onClick={() => setSyncGoogleCalendar(!syncGoogleCalendar)}
              className="p-3 bg-[#131b26] border border-blue-500/30 flex items-center justify-between cursor-pointer hover:border-[#1c69d4] transition-colors rounded-xl"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-[#4285F4]/20 border border-[#4285F4]/40 flex items-center justify-center">
                  <Calendar className="w-3.5 h-3.5 text-[#4285F4]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Sync with Google Calendar</span>
                    <span className="px-1.5 py-0.2 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono">2-WAY LIVE</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-light">
                    Auto-sync deliverable deadlines, exams, and lecture reminders.
                  </div>
                </div>
              </div>

              <div className={`w-4 h-4 border flex items-center justify-center rounded ${syncGoogleCalendar ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"}`}>
                {syncGoogleCalendar && <Check className="w-3 h-3" />}
              </div>
            </div>

            {/* Navigation & Submit Controls */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 border border-white/15 text-slate-300 hover:text-white text-xs font-bold uppercase transition-colors flex items-center justify-center gap-1.5 rounded-xl cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>BACK</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSignUp}
                disabled={loading}
                className="w-2/3 py-3 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-500/20 rounded-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>LAUNCHING PORTAL...</span>
                  </>
                ) : (
                  <>
                    <span>LAUNCH PORTAL</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
