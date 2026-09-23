import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ShieldCheck, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Sparkles, 
  AlertCircle, 
  Smartphone, 
  ArrowRight, 
  KeyRound, 
  CheckCircle2, 
  Loader2,
  PhoneCall,
  Crown,
  Zap,
  Info
} from "lucide-react";
import { useAuth, SimulatedConfirmationResult } from "../context/AuthContext";
import { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    setAuthModalOpen, 
    signInWithGoogle, 
    signInWithGitHub, 
    signInWithFacebook, 
    setupRecaptcha,
    requestPhoneOrWhatsAppOTP,
    verifyPhoneOrWhatsAppOTP,
    signInWithEmail, 
    signUpWithEmail, 
    signInAsGuest,
    loginWithFastPass,
    authError,
    setAuthError
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"social" | "whatsapp" | "email" | "quick_pass">("social");
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [displayName, setDisplayName] = useState<string>("");
  
  // WhatsApp / Phone OTP state
  const [phoneNumber, setPhoneNumber] = useState<string>("+919876543210");
  const [otpCode, setOtpCode] = useState<string>("");
  const [receivedOtp, setReceivedOtp] = useState<string | null>(null);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | SimulatedConfirmationResult | null>(null);
  const [isOtpSent, setIsOtpSent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(60);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    let timer: any;
    if (isOtpSent && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOtpSent, countdown]);

  useEffect(() => {
    if (isAuthModalOpen && activeTab === "whatsapp" && !recaptchaVerifierRef.current) {
      try {
        const verifier = setupRecaptcha("recaptcha-container");
        recaptchaVerifierRef.current = verifier;
      } catch {
        // Handled in context
      }
    }
  }, [isAuthModalOpen, activeTab, setupRecaptcha]);

  if (!isAuthModalOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle();
    } catch {
      // Error handled gracefully
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGitHubSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGitHub();
    } catch {
      // Error handled gracefully
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInWithFacebook();
    } catch {
      // Error handled gracefully
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsAppOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 6) {
      setAuthError("Please enter a valid WhatsApp phone number with country code (e.g., +919876543210 or +15551234567)");
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    try {
      let verifier = recaptchaVerifierRef.current;
      if (!verifier) {
        verifier = setupRecaptcha("recaptcha-container");
        recaptchaVerifierRef.current = verifier;
      }
      const res = await requestPhoneOrWhatsAppOTP(phoneNumber, verifier);
      setConfirmationResult(res);
      setIsOtpSent(true);
      setCountdown(60);

      const generatedCode = (res as any).otp || "123456";
      setReceivedOtp(generatedCode);
      setOtpCode(generatedCode);
      setOtpMessage((res as any).message || `OTP dispatched to ${phoneNumber} via WhatsApp Gateway`);
    } catch (err: any) {
      console.warn("OTP request handled:", err);
      setAuthError(err.message || "Failed to dispatch verification code. Please check the phone number.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult || !otpCode || otpCode.length < 4) {
      setAuthError("Please enter the verification code received (e.g. 123456).");
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    try {
      await verifyPhoneOrWhatsAppOTP(confirmationResult, otpCode);
    } catch (err: any) {
      console.warn("OTP verify handled:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setAuthError("Please provide both email and password.");
      return;
    }
    setIsSubmitting(true);
    setAuthError(null);
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, displayName || email.split("@")[0]);
      } else {
        await signInWithEmail(email, password);
      }
    } catch {
      // Handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSignIn = async () => {
    setIsSubmitting(true);
    try {
      await signInAsGuest();
    } catch {
      // Handled
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div id="recaptcha-container" />
      <motion.div 
        initial={{ scale: 0.94, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 10 }}
        className="w-full max-w-md bg-[#181825] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-800/80 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  CloudIDE Studio Pro
                </h2>
                <p className="text-xs text-gray-400">Universal Single Sign-On & Identity Hub</p>
              </div>
            </div>
            <button 
              onClick={() => {
                setAuthError(null);
                setAuthModalOpen(false);
              }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Admin Notice */}
          <div className="mt-3.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Admin: <strong>tarun98293@gmail.com</strong></span>
            </div>
            <button
              onClick={() => loginWithFastPass("tarun98293@gmail.com", "Tarun (Master Admin)", "admin", true)}
              className="px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded font-semibold text-[11px] transition-colors cursor-pointer border border-amber-500/40"
            >
              Instant Admin
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 mt-3.5 p-1 bg-[#11111b] rounded-lg border border-gray-800">
            <button
              onClick={() => { setActiveTab("social"); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "social" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              OAuth
            </button>
            <button
              onClick={() => { setActiveTab("whatsapp"); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "whatsapp" 
                  ? "bg-green-600 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              WhatsApp / OTP
            </button>
            <button
              onClick={() => { setActiveTab("email"); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "email" 
                  ? "bg-purple-600 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => { setActiveTab("quick_pass"); setAuthError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                activeTab === "quick_pass" 
                  ? "bg-amber-600 text-white shadow-sm" 
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              Fast Pass
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {authError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{authError}</div>
            </div>
          )}

          {/* TAB 1: SOCIAL & OAUTH LOGIN */}
          {activeTab === "social" && (
            <div className="space-y-3">
              {/* Google Sign-in */}
              <button
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-gray-100 text-gray-900 font-bold text-sm flex items-center justify-center gap-3 transition-all shadow-md disabled:opacity-50 cursor-pointer active:scale-[0.99] border border-gray-200"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z" />
                </svg>
                <span>Sign in with Google</span>
              </button>

              {/* GitHub Sign-in */}
              <button
                onClick={handleGitHubSignIn}
                disabled={isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-[#24292e] hover:bg-[#1f2328] text-white font-bold text-sm flex items-center justify-center gap-3 transition-all border border-gray-700 disabled:opacity-50 cursor-pointer active:scale-[0.99] shadow-md"
              >
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z"/>
                </svg>
                <span>Sign in with GitHub</span>
              </button>

              {/* Facebook Sign-in */}
              <button
                onClick={handleFacebookSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] text-white font-semibold text-sm flex items-center justify-center gap-3 transition-all border border-blue-600 disabled:opacity-50 cursor-pointer active:scale-[0.99]"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Continue with Facebook</span>
              </button>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#181825] px-2 text-gray-500">Free Session</span></div>
              </div>

              {/* Guest Access */}
              <button
                onClick={handleGuestSignIn}
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 font-medium text-xs flex items-center justify-center gap-2 transition-all border border-gray-700/60 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Continue as Guest (Sandboxed Sandbox Session)</span>
              </button>
            </div>
          )}

          {/* TAB 2: WHATSAPP / PHONE OTP */}
          {activeTab === "whatsapp" && (
            <div className="space-y-4">
              <div className="p-3 bg-green-950/30 border border-green-700/40 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-600/20 text-green-400 flex items-center justify-center shrink-0">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div className="text-xs text-green-200/90 leading-snug">
                  Sign in instantly using <strong>WhatsApp or SMS OTP</strong> verification with built-in instant pass bypass.
                </div>
              </div>

              {!isOtpSent ? (
                <form onSubmit={handleSendWhatsAppOTP} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1.5">
                      Phone / WhatsApp Number (with Country Code)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <PhoneCall className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+919876543210 or +15551234567"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#11111b] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-green-500 transition-colors font-mono"
                        required
                      />
                    </div>
                    <span className="text-[11px] text-gray-400 mt-1 block">Supported across all countries with WhatsApp or SMS verification</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-green-600/20"
                  >
                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>{isSubmitting ? "Dispatching WhatsApp Code..." : "Send Verification OTP"}</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP} className="space-y-3.5 animate-in fade-in">
                  {/* WhatsApp Code Delivery Notification */}
                  <div className="p-3 bg-emerald-950/70 border border-emerald-700/60 rounded-xl text-xs space-y-2">
                    <div className="flex items-center justify-between text-emerald-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Code Dispatched to WhatsApp
                      </span>
                      <span className="font-mono text-[11px] text-emerald-400 bg-emerald-900/60 px-2 py-0.5 rounded border border-emerald-700/40">
                        {phoneNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-emerald-800/40">
                      <span className="text-gray-300 text-[11px]">Your Verification OTP:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-300 text-sm tracking-wider">
                          {receivedOtp || "123456"}
                        </span>
                        <button
                          type="button"
                          onClick={() => setOtpCode(receivedOtp || "123456")}
                          className="px-2 py-0.5 bg-emerald-600/40 hover:bg-emerald-600/70 text-emerald-200 text-[10px] font-semibold rounded border border-emerald-500/40 transition-colors cursor-pointer"
                        >
                          Auto-Fill
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-300">
                        Enter 6-Digit OTP Code
                      </label>
                      {countdown > 0 ? (
                        <span className="text-[11px] text-gray-400">Resend in {countdown}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSendWhatsAppOTP()}
                          disabled={isSubmitting}
                          className="text-[11px] text-green-400 hover:text-green-300 underline font-medium cursor-pointer"
                        >
                          Resend Code via WhatsApp
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="••••••"
                        maxLength={6}
                        className="w-full pl-9 pr-3 py-2.5 bg-[#11111b] border border-gray-700 rounded-xl text-white text-lg tracking-widest font-mono text-center focus:outline-none focus:border-green-500 transition-colors"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsOtpSent(false); }}
                      className="px-3 py-2.5 rounded-xl bg-gray-800 text-gray-300 text-xs hover:bg-gray-700 font-medium cursor-pointer"
                    >
                      Change Number
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || otpCode.length < 4}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-green-600/20"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>{isSubmitting ? "Verifying..." : "Verify & Enter Studio Pro"}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 3: EMAIL & PASSWORD */}
          {activeTab === "email" && (
            <form onSubmit={handleEmailAuth} className="space-y-3.5">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1.5">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Developer Name"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#11111b] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                      required={isSignUp}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Work / Personal Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#11111b] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2.5 bg-[#11111b] border border-gray-700 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-purple-600/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{isSignUp ? "Create CloudIDE Account" : "Sign In with Email"}</span>
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setAuthError(null); }}
                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  {isSignUp ? "Already have an account? Sign in" : "Need an account? Sign up with email"}
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: 1-CLICK FAST EVALUATION PASS */}
          {activeTab === "quick_pass" && (
            <div className="space-y-3">
              <div className="p-3 bg-amber-950/30 border border-amber-700/40 rounded-xl flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div className="text-xs text-amber-200/90 leading-snug">
                  1-Click Role Switcher: Test any user level instantly without third-party redirects or credential roadblocks.
                </div>
              </div>

              <button
                onClick={() => loginWithFastPass("tarun98293@gmail.com", "Tarun (Master Admin)", "admin", true)}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-amber-600/20 to-amber-900/30 border border-amber-500/50 hover:border-amber-400 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5" /> Master Admin (tarun98293@gmail.com)
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Lifetime Unlimited Access + Protection Admin Center</div>
                </div>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <button
                onClick={() => loginWithFastPass("dev.pro@cloudide.io", "Pro Subscriber Developer", "user", true)}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-indigo-600/20 to-indigo-900/30 border border-indigo-500/50 hover:border-indigo-400 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Pro Subscriber (Paid Tier)
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">Gemini Copilot, Live Collaboration, Multi-Windows</div>
                </div>
                <ArrowRight className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                onClick={() => loginWithFastPass("dev.free@cloudide.io", "Standard Free Developer", "user", false)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-xs text-slate-300">Standard Free User</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Multi-Language Compilers & Terminal (Gated Pro features)</div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          )}

          {/* Footer Security Badges */}
          <div className="mt-5 pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>TLS 1.3 / AES-256 Cloud Shield</span>
            </span>
            <span>Firestore Auth v10</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
