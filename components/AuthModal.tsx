"use client";

import React, { useState, useRef } from "react";
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
  Calendar,
  Check,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
  RotateCcw
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

const SUGGESTED_DEGREES = [
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

export default function AuthModal({ isOpen, onClose, initialTab = "signin" }: AuthModalProps) {
  const { 
    signInWithPassword, 
    signUpWithPassword, 
    signInWithGoogleCustom, 
    signInWithGoogleDirect,
    resendEmailConfirmation,
    sendPasswordResetEmail,
    resetPasswordWithCode
  } = useAuth();
  
  const [tab, setTab] = useState<"signin" | "signup" | "forgot">(initialTab === "signup" ? "signup" : "signin");
  
  // 2-Step Flow: Step 1 (Credentials) -> Step 2 (Campus & Semester Details)
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");

  // Campus, Degree & Semester States
  const [university, setUniversity] = useState("University of Waterloo");
  const [degree, setDegree] = useState("B.Tech (Bachelor of Technology)");
  const [customDegreeText, setCustomDegreeText] = useState("");
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1-Click Google Sign-In State (on Sign In tab)
  const [isGoogleSignInOpen, setIsGoogleSignInOpen] = useState(false);
  const [googleSignInEmail, setGoogleSignInEmail] = useState("");

  // Google Verified Registration Dialog state (on Create Account tab)
  const [isGooglePickerOpen, setIsGooglePickerOpen] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [googlePassword, setGooglePassword] = useState("");
  const [googleConfirmPassword, setGoogleConfirmPassword] = useState("");
  const [showGooglePassword, setShowGooglePassword] = useState(false);
  const [googleUni, setGoogleUni] = useState("University of Waterloo");
  const [googleDegree, setGoogleDegree] = useState("B.Tech (Bachelor of Technology)");
  const [googleSemester, setGoogleSemester] = useState("Fall 2026");

  // Forgot Password / OTP Flow States
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);

  const emailInputRef = useRef<HTMLInputElement>(null);

  // Email validation with proper domain checks
  const isValidStudentEmail = (val: string): boolean => {
    if (!val || typeof val !== "string") return false;
    const trimmed = val.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(trimmed);
  };

  const handleForgotPasswordClick = () => {
    const trimmed = (email || "").trim();
    if (!trimmed || !isValidStudentEmail(trimmed)) {
      setError("Please enter your complete student email address (e.g. student@uwaterloo.ca or name@gmail.com) first.");
      setTimeout(() => {
        emailInputRef.current?.focus();
      }, 50);
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setForgotEmail(trimmed.toLowerCase());
    setForgotStep(1);
    setTab("forgot");
  };

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    const res = await signInWithPassword(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || "Account not registered. Please switch to 'Create Account' to register your student profile first.");
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
      setError("Password must be at least 6 characters in length.");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setError("Passwords do not match. Please verify your password.");
      return;
    }
    setStep(2);
  };

  // Step 2: Final Submission with Supabase Email Verification Link
  const handleFinalSignUp = async () => {
    setError(null);
    setLoading(true);
    const finalDegree = degree === "Other (Custom Degree / Program)..."
      ? (customDegreeText.trim() || "Higher Education")
      : degree;

    const res = await signUpWithPassword(
      fullName,
      university || "University of Waterloo", 
      finalDegree || "B.Tech (Bachelor of Technology)",
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

  // 1-Click Google Sign In (for existing registered students)
  const handleGoogleDirectSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    const targetEmail = (googleSignInEmail || email).trim();
    if (!targetEmail || !isValidStudentEmail(targetEmail)) {
      setError("Please enter your registered student Google email address (e.g. student@uwaterloo.ca or name@gmail.com).");
      return;
    }

    setLoading(true);
    const res = await signInWithGoogleDirect(targetEmail);
    setLoading(false);
    if (res.success) {
      setIsGoogleSignInOpen(false);
      onClose();
    } else {
      setError(res.error || `No registered student account found for "${targetEmail}". Please create your account first.`);
    }
  };

  // Google Verified Sign-Up with Master Password
  const handleGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleName) {
      setError("Please enter your student Google email and full name.");
      return;
    }
    if (!googlePassword || googlePassword.length < 6) {
      setError("Please create a master password with at least 6 characters.");
      return;
    }
    if (googleConfirmPassword && googlePassword !== googleConfirmPassword) {
      setError("Master passwords do not match. Please check and retype.");
      return;
    }

    setLoading(true);
    const res = await signInWithGoogleCustom(
      googleEmail, 
      googleName, 
      googleUni || "University of Waterloo", 
      googleDegree || "B.Tech (Bachelor of Technology)",
      googleSemester || "Fall 2026",
      "Computer Science",
      selectedCourses,
      syncGoogleCalendar,
      googlePassword
    );
    setLoading(false);
    if (res.success) {
      setIsGooglePickerOpen(false);
      onClose();
    } else {
      setError(res.error || "Google authentication failed.");
    }
  };

  // Forgot Password Step 1: Send 6-Digit Code via Email
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!forgotEmail) {
      setError("Please enter your registered student email.");
      return;
    }
    setLoading(true);
    const res = await sendPasswordResetEmail(forgotEmail);
    setLoading(false);
    if (res.success) {
      setSuccessMessage("A 6-digit verification code has been dispatched to your email!");
      setForgotStep(2);
    } else {
      setError(res.error || "Could not send verification code. Ensure your account is registered.");
    }
  };

  // Forgot Password Step 2: Verify Code & Reset Password
  const handleVerifyCodeAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    if (!resetCode || !newPassword) {
      setError("Please enter the 6-digit code and your new password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (confirmNewPassword && newPassword !== confirmNewPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const res = await resetPasswordWithCode(forgotEmail, resetCode, newPassword);
    setLoading(false);
    if (res.success) {
      setSuccessMessage("Password reset successfully! Logging you in...");
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setError(res.error || "Invalid or expired recovery code. Please check your inbox.");
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
            {isGoogleSignInOpen
              ? "1-Click Google Sign-In"
              : isGooglePickerOpen
                ? "Google Verified Registration"
                : tab === "forgot" 
                  ? "Account Recovery"
                  : tab === "signin" 
                    ? "Welcome Back" 
                    : step === 1 
                      ? "Create Student Account" 
                      : "Campus & Semester Setup"}
          </h2>
          <p className="text-xs text-slate-400 font-light">
            {isGoogleSignInOpen
              ? "Instant verification for existing registered Google accounts."
              : isGooglePickerOpen
                ? "Setup your university profile with Google verified email."
                : tab === "forgot"
                  ? "Recover your student portal password via 6-digit email code."
                  : tab === "signin" 
                    ? "Sign in with your student email or Google account." 
                    : step === 1 
                      ? "Step 1 of 2: Enter student identity and credentials." 
                      : "Step 2 of 2: Set university, semester, and Google Calendar sync."}
          </p>
        </div>

        {/* Progress Bar for Sign Up */}
        {tab === "signup" && !isGooglePickerOpen && !isGoogleSignInOpen && (
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

        {/* Sign In vs Create Account Tabs (only on step 1 when not in forgot/google mode) */}
        {step === 1 && !isGooglePickerOpen && !isGoogleSignInOpen && tab !== "forgot" && (
          <div className="grid grid-cols-2 border-b border-white/10 mb-6 text-xs text-center font-mono">
            <button
              onClick={() => { setTab("signin"); setError(null); setSuccessMessage(null); }}
              className={`py-2.5 border-b-2 transition-all cursor-pointer ${
                tab === "signin" 
                  ? "border-[#1c69d4] text-white font-bold bg-[#141b24]" 
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              SIGN IN
            </button>
            <button
              onClick={() => { setTab("signup"); setError(null); setSuccessMessage(null); }}
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
          <div className="p-3.5 mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
            {error.toLowerCase().includes("incorrect password") || error.toLowerCase().includes("credentials") ? (
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#b5952f] text-black text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1.5 flex-shrink-0 self-start sm:self-auto cursor-pointer shadow-md shadow-amber-500/20"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Reset Password (Code)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : error.toLowerCase().includes("already registered") || error.toLowerCase().includes("already exists") ? (
              <button
                type="button"
                onClick={() => {
                  setTab("signin");
                  setError(null);
                  setIsGooglePickerOpen(false);
                  setIsGoogleSignInOpen(false);
                  if (googleEmail && !email) setEmail(googleEmail);
                }}
                className="px-3 py-1.5 bg-[#1c69d4] hover:bg-[#1554aa] text-white text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 self-start sm:self-auto cursor-pointer"
              >
                <span>Sign In Instead</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : error.toLowerCase().includes("not registered") || error.toLowerCase().includes("no registered student account") || error.toLowerCase().includes("no student account found") ? (
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setStep(1);
                  setIsGoogleSignInOpen(false);
                  setIsGooglePickerOpen(false);
                  if (googleSignInEmail && !email) setEmail(googleSignInEmail);
                  setError(null);
                }}
                className="px-3 py-1.5 bg-[#d4af37] hover:bg-[#b5952f] text-black text-xs font-bold uppercase rounded-lg transition-colors flex items-center gap-1 flex-shrink-0 self-start sm:self-auto cursor-pointer shadow-md shadow-amber-500/20"
              >
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : null}
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successMessage}</span>
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

        {/* ========================================================================= */}
        {/* VIEW 1A: 1-CLICK GOOGLE SIGN IN FOR PRE-REGISTERED STUDENTS               */}
        {/* ========================================================================= */}
        {isGoogleSignInOpen ? (
          <form onSubmit={handleGoogleDirectSignIn} className="space-y-4 animate-in fade-in duration-150">
            <div className="p-3.5 bg-[#131b26] border border-white/10 text-xs text-white space-y-1.5 rounded-xl">
              <div className="font-bold flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Account Verification</span>
                <span className="ml-auto px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[9px] font-mono uppercase font-bold rounded">
                  1-Click Entry
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Confirm your student Google email. If your account is registered, you will be authenticated directly into your dashboard.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                STUDENT GOOGLE EMAIL
              </label>
              <input
                type="email"
                required
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                value={googleSignInEmail}
                onChange={(e) => setGoogleSignInEmail(e.target.value)}
                placeholder="student@uwaterloo.ca or name@gmail.com"
                className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => { setIsGoogleSignInOpen(false); setError(null); }}
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
                    <span>VERIFYING ACCOUNT...</span>
                  </>
                ) : (
                  <>
                    <span>VERIFY & SIGN IN</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : isGooglePickerOpen ? (
          <form onSubmit={handleGoogleSubmit} className="space-y-3.5 animate-in fade-in duration-150">
            <div className="p-3 bg-[#131b26] border border-white/10 text-xs text-white space-y-1 rounded-xl">
              <div className="font-bold flex items-center gap-2">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Google Verified Authentication</span>
                <span className="ml-auto px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 text-[9px] font-mono uppercase font-bold rounded">
                  Automated Identity
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Google verifies your student email and identity token with zero manual confirmation links required.
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
                className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-xs text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
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
                className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-xs text-white focus:border-[#1c69d4] outline-none rounded-xl"
              />
            </div>

            {/* Mandatory Master Password Setup on Google Registration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1 flex items-center justify-between">
                  <span>MASTER PASSWORD</span>
                  <button
                    type="button"
                    onClick={() => setShowGooglePassword(!showGooglePassword)}
                    className="text-[10px] text-slate-400 hover:text-white"
                  >
                    {showGooglePassword ? "Hide" : "Show"}
                  </button>
                </label>
                <div className="relative">
                  <input
                    type={showGooglePassword ? "text" : "password"}
                    required
                    value={googlePassword}
                    onChange={(e) => setGooglePassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-xs text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  CONFIRM PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showGooglePassword ? "text" : "password"}
                    required
                    value={googleConfirmPassword}
                    onChange={(e) => setGoogleConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 px-3 bg-[#090d12] border border-white/15 text-xs text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                </div>
              </div>
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

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                DEGREE / PROGRAM
              </label>
              <select
                value={googleDegree}
                onChange={(e) => setGoogleDegree(e.target.value)}
                className="w-full h-10 px-2.5 bg-[#090d12] border border-white/15 text-xs text-white outline-none rounded-xl font-medium"
              >
                {SUGGESTED_DEGREES.map((deg, dIdx) => (
                  <option key={dIdx} value={deg} className="bg-[#0f141c] text-white">
                    {deg}
                  </option>
                ))}
              </select>
            </div>

            {/* Google Calendar Sync Option with Explanatory Badges */}
            <div 
              onClick={() => setSyncGoogleCalendar(!syncGoogleCalendar)}
              className="p-3 bg-[#090d12] border border-white/10 flex flex-col gap-1 cursor-pointer hover:border-[#1c69d4] transition-colors rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-[#4285F4]" />
                  <span className="font-semibold text-white">Sync with Google Calendar (2-Way)</span>
                </div>
                <div className={`w-4 h-4 border flex items-center justify-center rounded ${syncGoogleCalendar ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"}`}>
                  {syncGoogleCalendar && <Check className="w-3 h-3" />}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 pl-6">
                {syncGoogleCalendar 
                  ? "⚡ Live Sync: Exam & assignment alerts dispatch to your phone & Google Calendar." 
                  : "🔒 Local Only: Schedules remain 100% private inside your portal."}
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
                className="w-2/3 py-3 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 rounded-xl cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>LAUNCHING PORTAL...</span>
                  </>
                ) : (
                  <>
                    <span>COMPLETE GOOGLE SIGN-UP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

        ) : tab === "forgot" ? (
          /* ========================================================================= */
          /* VIEW 2: FORGOT PASSWORD 6-DIGIT EMAIL CODE (OTP) RECOVERY FLOW            */
          /* ========================================================================= */
          <div className="space-y-4 animate-in fade-in duration-150">
            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div className="p-3 bg-[#131b26] border border-white/10 text-xs text-white space-y-1 rounded-xl">
                  <div className="font-bold flex items-center gap-2 text-[#d4af37]">
                    <KeyRound className="w-4 h-4" />
                    <span>6-Digit Verification Code Recovery</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Enter your registered student email address. We will dispatch a 6-digit recovery PIN to your inbox.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                    STUDENT EMAIL
                  </label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="student@uwaterloo.ca"
                    className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-lg shadow-blue-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>DISPATCHING 6-DIGIT CODE...</span>
                    </>
                  ) : (
                    <>
                      <span>SEND VERIFICATION CODE</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setTab("signin"); setError(null); setSuccessMessage(null); }}
                    className="text-xs text-slate-400 hover:text-white font-mono flex items-center justify-center gap-1 mx-auto"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyCodeAndReset} className="space-y-4">
                <div className="p-3 bg-[#131b26] border border-emerald-500/30 text-xs text-emerald-300 space-y-1 rounded-xl">
                  <div className="font-bold flex items-center gap-2 text-emerald-400">
                    <Mail className="w-4 h-4" />
                    <span>Code Dispatched to {forgotEmail}</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Please check your inbox (or spam) and enter the 6-digit recovery PIN below.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                    ENTER 6-DIGIT RECOVERY PIN
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="123456"
                    className="w-full h-12 text-center tracking-[8px] font-mono text-xl font-bold bg-[#090d12] border border-[#1c69d4] text-white focus:ring-2 focus:ring-[#1c69d4]/30 outline-none rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1 flex items-center justify-between">
                      <span>NEW PASSWORD</span>
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        {showNewPassword ? "Hide" : "Show"}
                      </button>
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                      CONFIRM NEW PASSWORD
                    </label>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 cursor-pointer rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>VERIFYING CODE & RESETTING...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>VERIFY CODE & RESET PASSWORD</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="hover:text-white flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend Code</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setTab("signin"); setError(null); setSuccessMessage(null); }}
                    className="hover:text-white flex items-center gap-1"
                  >
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </div>

        ) : tab === "signin" ? (
          /* ========================================================================= */
          /* VIEW 3: SIGN IN TAB (STRICT REGISTRATION GATE + FORGOT PASSWORD LINK)     */
          /* ========================================================================= */
          <div className="space-y-4">
            <button
              onClick={() => {
                setGoogleSignInEmail(email || "");
                setIsGoogleSignInOpen(true);
                setError(null);
              }}
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
                  ref={emailInputRef}
                  type="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@uwaterloo.ca"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono uppercase text-slate-300">
                    PASSWORD
                  </label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoCapitalize="none"
                    autoCorrect="off"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex justify-end mt-1.5">
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-xs text-[#60a5fa] hover:text-[#93c5fd] font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 py-1"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-[#d4af37]" />
                    <span>Forgot Password?</span>
                  </button>
                </div>
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
          /* ========================================================================= */
          /* VIEW 4: STEP 1: CREATE ACCOUNT (CREDENTIALS)                              */
          /* ========================================================================= */
          <div className="space-y-4">
            <button
              onClick={() => setIsGooglePickerOpen(true)}
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
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  STUDENT EMAIL (FOR CONFIRMATION LINK)
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@university.edu"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-mono uppercase text-slate-300">
                    CREATE PASSWORD (MIN 6 CHARACTERS)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer font-mono"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? "Hide" : "Show"}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  CONFIRM PASSWORD
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl font-mono"
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
          /* ========================================================================= */
          /* VIEW 5: STEP 2: CAMPUS, DEGREE & ENROLLMENT SETUP                         */
          /* ========================================================================= */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                UNIVERSITY / CAMPUS
              </label>
              <input
                type="text"
                list="university-list"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                placeholder="e.g. University of Waterloo"
                className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
              />
              <datalist id="university-list">
                {POPULAR_UNIVERSITIES.map((u, i) => (
                  <option key={i} value={u} />
                ))}
              </datalist>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  SEMESTER / TERM
                </label>
                <input
                  type="text"
                  list="semester-list"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="e.g. Fall 2026"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                />
                <datalist id="semester-list">
                  {SUGGESTED_SEMESTERS.map((s, i) => (
                    <option key={i} value={s} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  MAJOR / CONCENTRATION
                </label>
                <input
                  type="text"
                  value={major}
                  onChange={(e) => setMajor(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                DEGREE / PROGRAM
              </label>
              <select
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
              >
                {SUGGESTED_DEGREES.map((deg, i) => (
                  <option key={i} value={deg} className="bg-[#0f141c] text-white">
                    {deg}
                  </option>
                ))}
              </select>
            </div>

            {degree === "Other (Custom Degree / Program)..." && (
              <div className="animate-in fade-in duration-150">
                <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1">
                  SPECIFY YOUR PROGRAM NAME
                </label>
                <input
                  type="text"
                  value={customDegreeText}
                  onChange={(e) => setCustomDegreeText(e.target.value)}
                  placeholder="e.g. Dual Degree in AI & Neuroscience"
                  className="w-full h-11 px-3 bg-[#090d12] border border-white/15 text-sm text-white focus:border-[#1c69d4] outline-none rounded-xl"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-mono uppercase text-slate-300 mb-1.5">
                ENROLLED COURSES (SELECT INITIAL SUBJECTS)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SUGGESTED_COURSES.map((course, idx) => {
                  const isSelected = selectedCourses.includes(course);
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleCourse(course)}
                      className={`p-2.5 text-xs text-left border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-[var(--primary)]/15 border-[var(--primary)] text-white font-bold" 
                          : "bg-[#090d12] border-white/10 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <span className="truncate pr-2">{course}</span>
                      <div className={`w-4 h-4 border flex items-center justify-center rounded flex-shrink-0 ${
                        isSelected ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"
                      }`}>
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Google Calendar Sync Option with Explanatory Badges */}
            <div 
              onClick={() => setSyncGoogleCalendar(!syncGoogleCalendar)}
              className="p-3 bg-[#090d12] border border-white/10 flex flex-col gap-1 cursor-pointer hover:border-[#1c69d4] transition-colors rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <Calendar className="w-4 h-4 text-[#4285F4]" />
                  <span className="font-semibold text-white">Sync with Google Calendar (2-Way)</span>
                </div>
                <div className={`w-4 h-4 border flex items-center justify-center rounded ${syncGoogleCalendar ? "bg-[var(--primary)] border-[var(--primary)] text-white" : "border-slate-600"}`}>
                  {syncGoogleCalendar && <Check className="w-3 h-3" />}
                </div>
              </div>
              <div className="text-[10px] text-slate-400 pl-6">
                {syncGoogleCalendar 
                  ? "⚡ Live Sync: Exam & assignment alerts dispatch to your phone & Google Calendar." 
                  : "🔒 Local Only: Schedules remain 100% private inside your portal."}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-1/3 py-3 border border-white/15 text-slate-300 hover:text-white text-xs font-bold uppercase transition-colors rounded-xl cursor-pointer"
              >
                BACK
              </button>
              <button
                type="button"
                onClick={handleFinalSignUp}
                disabled={loading}
                className="w-2/3 py-3 bg-[var(--primary)] hover:bg-[var(--primary-active)] text-white text-xs font-bold uppercase tracking-[1px] transition-all flex items-center justify-center gap-2 rounded-xl cursor-pointer shadow-lg shadow-blue-500/20"
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
