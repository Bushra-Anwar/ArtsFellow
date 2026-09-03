import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Lock,
  X,
  Smartphone,
  QrCode,
  Mail,
  ArrowRight,
  Github,
  Facebook,
  LayoutDashboard,
  Package,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";
import ArtistAvatar from "./ArtistAvatar";

type LoginMethod = "password" | "otp" | "qr";

const LoginTab: React.FC = () => {
  const navigate = useNavigate();
  const {
    loginWithEmail,
    loginWithOtp,
    sendOtp,
    forgotPassword,
    resetPassword,
    verifySignup,
    initiateQrLogin,
    user,
    logout,
  } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [method, setMethod] = useState<LoginMethod>("password");

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleOpenLogin = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsOpen(true);

      if (customEvent.detail?.mode === "signup") {
        setIsSignup(true);
      } else {
        setIsSignup(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("open-login-modal", handleOpenLogin);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("open-login-modal", handleOpenLogin);
    };
  }, []);

  // Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [qrSession, setQrSession] = useState("");

  // Flow States
  const [isSignup, setIsSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1); // 1: Details, 2: OTP
  const [isArtist, setIsArtist] = useState(false);

  const [isForgotPass, setIsForgotPass] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset handlers
  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
    setIsForgotPass(false);
    setIsSignup(false);
    setSignupStep(1);
    setIsArtist(false);
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(false);
  };

  // Central Login/Signup Handler
  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setLoading(true);

    try {
      // Helper function for redirection
      const handleRedirect = () => {
        // Show Welcome Message
        alert("Welcome! You can now enjoy full access to ARTsFellow."); // Simple alert as requested ("message popup")

        const stored = localStorage.getItem("art_user");
        if (stored) {
          const u = JSON.parse(stored);
          if (u.role === "admin") navigate("/admin");
          else if (u.role === "artist") navigate("/artist");
          else navigate("/"); // Stay or go home
        }
      };

      if (isSignup) {
        // Handle Signup
        if (signupStep === 1) {
          // Step 1: Send OTP
          if (!name || !email || !password) {
            setErrorMsg("All fields are required.");
            setLoading(false);
            return;
          }
          if (password.length < 6) {
            setErrorMsg("Password must be at least 6 characters long.");
            setLoading(false);
            return;
          }
          // Send OTP
          const result = await sendOtp(email, null, false); // email=email, phone=null, isLogin=false
          if (result.success) {
            setSignupStep(2);
            setSuccessMsg(`OTP sent to ${email}`);
          } else {
            setErrorMsg(
              result.message || "Failed to send OTP. Please try again.",
            );
          }
          setLoading(false);
          return;
        } else {
          // Step 2: Verify OTP
          const result = await verifySignup({
            email,
            otp,
            name,
            password,
            role: isArtist ? "artist" : "customer",
          });
          if (result.success) {
            setIsOpen(false);
            resetForm();
            handleRedirect(); // Redirect
          } else {
            setErrorMsg(result.message || "Verification failed. Invalid OTP?");
          }
          setLoading(false);
          return;
        }
      }

      // Handle Login
      if (method === "password") {
        const result = await loginWithEmail(email, password);
        if (result.success) {
          setIsOpen(false);
          resetForm();
          handleRedirect(); // Redirect
        } else {
          setErrorMsg(
            result.message || "Invalid credentials. Please try again.",
          );
        }
      } else if (method === "otp") {
        if (!otpSent) {
          // Step 1: Send OTP for Login
          if (!email) {
            setErrorMsg("Please enter your email or mobile.");
            setLoading(false);
            return;
          }
          // Check if it is email or phone (simple check)
          const isEmail = email.includes("@");
          const result = await sendOtp(
            isEmail ? email : null,
            !isEmail ? email : null,
            true,
          ); // isLogin=true
          if (result.success) {
            setOtpSent(true);
            setSuccessMsg(`OTP sent to ${email}`);
          } else {
            setErrorMsg(
              result.message || "Failed to send OTP. User not found?",
            );
          }
        } else {
          // Step 2: Verify OTP
          const isEmail = email.includes("@");
          const result = await loginWithOtp(email, otp, isEmail);
          if (result.success) {
            setIsOpen(false);
            resetForm();
            handleRedirect(); // Redirect
          } else {
            setErrorMsg(
              result.message || "Invalid OTP. Please check and try again.",
            );
          }
        }
      }
    } catch (err) {
      setErrorMsg("An error occurred during authentication.");
    } finally {
      if (!isSignup || (isSignup && signupStep === 2)) setLoading(false);
    }
  };

  // Forgot Password Flow
  const handleForgotPassSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    if (signupStep === 1) {
      // Step 1: Send OTP
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccessMsg(`OTP sent to ${email}`);
        setSignupStep(2); // Move to OTP step
      } else {
        setErrorMsg(
          result.message || "Failed to send OTP. Email may not exist.",
        );
      }
    } else {
      // Step 2: Verify & Reset
      if (password.length < 6) {
        setErrorMsg("Password must be at least 6 characters long.");
        setLoading(false);
        return;
      }
      const result = await resetPassword(email, otp, password);
      if (result.success) {
        setSuccessMsg("Password Reset Successfully! You can now login.");
        setTimeout(() => {
          setIsForgotPass(false);
          setSignupStep(1);
          setMethod("password"); // Switch to login view
        }, 2000);
      } else {
        setErrorMsg(result.message || "Invalid OTP or Failed to reset.");
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (method === "qr" && isOpen) {
      setQrSession(initiateQrLogin());
    }
  }, [method, isOpen]);

  return (
    <div className="relative z-50" ref={containerRef}>
      {/* Painting Disk Trigger */}
      {/* Login Trigger / Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative outline-none"
        aria-label={user ? "Open Profile Menu" : "Login"}
      >
        {user ? (
          <div className="flex items-center gap-2 px-1 pr-3 py-1 bg-white dark:bg-[var(--card-bg)] border border-gray-200 dark:border-slate-700 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95">
            <ArtistAvatar
              src={user.avatar}
              alt={user.name}
              className="w-10 h-10 -ml-1 transition-transform group-hover:scale-105"
              fallbackText={user.name?.charAt(0).toUpperCase()}
            />
            <div className="text-left hidden sm:block">
              <p className="text-sm font-bold text-slate-800 dark:text-gray-200 leading-none max-w-[100px] truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium leading-none mt-0.5 capitalize">
                {user.role}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-1 rounded-full text-white transition-transform hover:scale-105 active:scale-95">
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-primary-dark)] rounded-full animate-spin-slow opacity-75 group-hover:opacity-100 transition-opacity" />
            <div className="relative bg-white dark:bg-[var(--card-bg)] p-1.5 rounded-lg border border-[var(--color-primary)]/20 shadow-sm">
              <Logo className="h-5" showText={false} />
            </div>
          </div>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Full Screen Backdrop */}
            {!user && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#0a1c22]/60 backdrop-blur-sm z-[45]"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              />
            )}

            <motion.div
              key="login-modal"
              className={`absolute right-0 sm:right-10 top-full mt-4 backdrop-blur-2xl border border-[var(--glass-border)] shadow-[0_24px_54px_-12px_rgba(0,0,0,0.2)] z-50 origin-top-right overflow-hidden transition-all duration-300 ${user ? "w-[280px] bg-[var(--bg-primary)] rounded-tl-[3rem] rounded-bl-[3rem] rounded-br-[3rem] rounded-tr-[6px]" : "w-[320px] max-w-[95vw] sm:w-[360px] bg-[var(--bg-primary)] rounded-[2rem]"}`}

              initial={{
                opacity: 0,
                scale: 0.8,
                y: -20,
                rotateX: -15,
                filter: "blur(10px)",
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                rotateX: 0,
                filter: "blur(0px)",
              }}
              exit={{ opacity: 0, scale: 0.8, y: -20, filter: "blur(10px)" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-[var(--primary)] via-orange-500 to-red-500" />

              {user ? (
                <div className="p-3">
                  <div className="p-4 mb-2 rounded-tl-[2rem] rounded-bl-[2rem] rounded-br-[2rem] rounded-tr-[4px] border border-white/60 dark:border-white/5 flex items-center gap-4 bg-gradient-to-br from-orange-50/90 to-red-50/90 dark:from-[var(--primary)]/10 dark:to-orange-500/10 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-white/40 to-transparent dark:from-white/10 rounded-bl-full pointer-events-none" />
                    <ArtistAvatar
                      src={user.avatar}
                      alt={user.name}
                      className="w-14 h-14 relative z-10 transition-transform group-hover:scale-105"
                      fallbackText={user.name?.charAt(0).toUpperCase()}
                    />
                    <div className="overflow-hidden relative z-10">
                      <p className="font-serif-magic italic font-bold text-slate-800 dark:text-[var(--text-main)] truncate text-[1.1rem] leading-tight tracking-wide">
                        {user.name}
                      </p>
                      <p className="text-[9px] text-slate-500 dark:text-[var(--text-muted)] font-black uppercase tracking-widest truncate mt-0.5 opacity-80">
                        {user.email || user.phone}
                      </p>
                    </div>
                  </div>
                  <div className="px-2 py-1 space-y-1">
                    {user.role === "admin" && (
                      <a
                        href="/admin"
                        className="flex items-center gap-3 px-4 py-3 text-[13px] text-slate-600 dark:text-[var(--text-main)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm transition-all font-bold group"
                      >
                        <Lock
                          size={16}
                          className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"
                        />{" "}
                        Admin Panel
                      </a>
                    )}
                    {user.role === "artist" && (
                      <>
                        <a
                          href="/artist"
                          className="flex items-center gap-3 px-4 py-3 text-[13px] text-slate-600 dark:text-[var(--text-main)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm transition-all font-bold group"
                        >
                          <LayoutDashboard
                            size={16}
                            className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"
                          />{" "}
                          Dashboard
                        </a>
                        <a
                          href={`/artist/${user._id}`}
                          className="flex items-center gap-3 px-4 py-3 text-[13px] text-slate-600 dark:text-[var(--text-main)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm transition-all font-bold group"
                        >
                          <User
                            size={16}
                            className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"
                          />{" "}
                          My Profile
                        </a>
                      </>
                    )}
                    {user.role === "customer" && (
                      <>
                        <a
                          href="/profile"
                          className="flex items-center gap-3 px-4 py-3 text-[13px] text-slate-600 dark:text-[var(--text-main)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm transition-all font-bold group"
                        >
                          <User
                            size={16}
                            className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"
                          />{" "}
                          My Profile
                        </a>
                        <a
                          href="/orders"
                          className="flex items-center gap-3 px-4 py-3 text-[13px] text-slate-600 dark:text-[var(--text-main)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm transition-all font-bold group"
                        >
                          <Package
                            size={16}
                            className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors"
                          />{" "}
                          My Orders
                        </a>
                      </>
                    )}
                  </div>
                  <div className="mt-2 pt-2 px-2 border-t border-gray-100/60 dark:border-white/10">
                    <button
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-tl-2xl rounded-bl-2xl rounded-br-2xl rounded-tr-sm transition-all font-bold flex items-center gap-3 group"
                    >
                      <Lock
                        size={16}
                        className="opacity-0 w-0 group-hover:w-4 group-hover:opacity-100 transition-all -ml-2"
                      />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-serif-magic italic text-[var(--text-main)]">
                      {isSignup
                        ? `Join Studio`
                        : isForgotPass
                          ? "Reset Pass"
                          : method === "otp" && otpSent
                            ? "Verify OTP"
                            : "Artist Login"}
                    </h3>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        resetForm();
                      }}
                      className="p-1.5 rounded-full hover:bg-[var(--glass-border)] transition-all"
                    >
                      <X size={20} className="text-[var(--text-muted)]" />
                    </button>
                  </div>

                  {!isForgotPass && !isSignup && (
                    <div className="flex p-1 bg-[var(--bg-primary)] border border-[var(--glass-border)] rounded-xl mb-4">
                      {[
                        { id: "password", icon: Lock, label: "Password" },
                        { id: "otp", icon: Smartphone, label: "OTP" },
                        { id: "qr", icon: QrCode, label: "QR" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => {
                            setMethod(m.id as any);
                            resetForm();
                          }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${method === m.id ? "bg-[var(--primary)] text-white shadow-xl shadow-[var(--primary)]/20" : "text-[var(--text-muted)] hover:text-[var(--text-main)]"}`}
                        >
                          <m.icon size={13} /> {m.label}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="min-h-[200px]">
                    {isSignup ? (
                      <motion.form
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        onSubmit={handleAuthAction}
                        className="space-y-4"
                      >
                        {signupStep === 1 ? (
                          <>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                Full Name
                              </label>
                              <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all"
                                placeholder="Artist Name"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                Email Space
                              </label>
                              <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all"
                                placeholder="your@art.com"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                Passcode
                              </label>
                              <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all"
                                placeholder="Create passcode"
                              />
                            </div>
                            <button
                              disabled={loading}
                              className="w-full py-4 bg-[var(--primary)] text-white font-black rounded-2xl hover:bg-[var(--secondary)] transition-all disabled:opacity-50 text-xs uppercase tracking-[0.2em] shadow-xl shadow-[var(--primary)]/20"
                            >
                              {loading ? "Thinking..." : "Continue"}
                            </button>
                          </>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-4"
                          >
                            <div className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl text-center text-xs font-bold">
                              Code dispatched to <b>{email}</b>
                            </div>
                            <div className="space-y-1 text-center">
                              <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase">
                                Input Code
                              </label>
                              <input
                                type="text"
                                required
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                className="w-full px-3 py-4 rounded-xl bg-transparent border-2 border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-2xl text-center font-black tracking-[0.5rem]"
                                placeholder="000000"
                                maxLength={6}
                              />
                            </div>
                            <button
                              disabled={loading}
                              className="w-full py-3 bg-[var(--primary)] text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 text-xs"
                            >
                              {loading ? "Verifying..." : "VERIFY & ENTER"}
                            </button>
                          </motion.div>
                        )}
                        <div className="text-center text-[10px] text-[var(--text-muted)] mt-4">
                          Already have a canvas?{" "}
                          <button
                            type="button"
                            onClick={() => {
                              setIsSignup(false);
                              setSignupStep(1);
                            }}
                            className="font-black text-[var(--primary)] hover:underline uppercase"
                          >
                            Log In
                          </button>
                        </div>
                        {errorMsg && (
                          <p className="text-center text-xs text-red-500 bg-red-500/10 p-3 rounded-xl font-bold border border-red-500/10 mt-3">
                            {errorMsg}
                          </p>
                        )}
                      </motion.form>
                    ) : (
                      <>
                        {isForgotPass ? (
                          <motion.form
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            onSubmit={handleForgotPassSubmit}
                            className="space-y-3"
                          >
                            {signupStep === 1 ? (
                              <>
                                <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/10 text-[11px] text-yellow-600 dark:text-yellow-400 font-medium">
                                  Provide registered email for reset code.
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                    Email Identity
                                  </label>
                                  <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all"
                                    placeholder="user@example.com"
                                  />
                                </div>
                                <button
                                  disabled={loading}
                                  className="w-full py-3 bg-[var(--primary)] text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 text-xs text-center uppercase"
                                >
                                  {loading ? "Sending..." : "Send Code"}
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/10 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                                  Code sent to {email}.
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                    Reset Code
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-center font-mono text-xl tracking-widest"
                                    placeholder="000000"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                    New Passcode
                                  </label>
                                  <input
                                    type="password"
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) =>
                                      setPassword(e.target.value)
                                    }
                                    className="w-full px-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all"
                                    placeholder="New secure passcode"
                                  />
                                </div>
                                <button
                                  disabled={loading}
                                  className="w-full py-3 bg-[var(--primary)] text-white font-black rounded-xl shadow-md transition-all disabled:opacity-50 text-xs uppercase"
                                >
                                  {loading ? "Resetting..." : "Update"}
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setIsForgotPass(false);
                                resetForm();
                              }}
                              className="w-full text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--primary)] uppercase"
                            >
                              Back
                            </button>
                            {successMsg && (
                              <p className="text-center text-[10px] text-green-500 font-bold mt-1 tracking-tight">
                                {successMsg}
                              </p>
                            )}
                            {errorMsg && (
                              <p className="text-center text-[10px] text-red-500 font-bold mt-1 tracking-tight">
                                {errorMsg}
                              </p>
                            )}
                          </motion.form>
                        ) : (
                          <>
                            {(method === "password" || method === "otp") && (
                              <motion.form
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                onSubmit={handleAuthAction}
                                className="space-y-5"
                              >
                                {method === "password" && (
                                  <>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                        Artist ID
                                      </label>
                                      <div className="relative group">
                                        <User
                                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors"
                                          size={16}
                                        />
                                        <input
                                          type="email"
                                          required
                                          value={email}
                                          onChange={(e) =>
                                            setEmail(e.target.value)
                                          }
                                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all"
                                          placeholder="your@art.com"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                        Passcode
                                      </label>
                                      <div className="relative group">
                                        <Lock
                                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors"
                                          size={16}
                                        />
                                        <input
                                          type="password"
                                          required
                                          value={password}
                                          onChange={(e) =>
                                            setPassword(e.target.value)
                                          }
                                          className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all"
                                          placeholder="••••••••"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex justify-between items-center text-[9px] font-bold tracking-wider">
                                      <div className="flex items-center gap-1.5">
                                        <input
                                          type="checkbox"
                                          id="remember"
                                          className="w-3.5 h-3.5 rounded border-[var(--glass-border)] accent-[var(--primary)] bg-[var(--glass-border)]"
                                        />
                                        <label
                                          htmlFor="remember"
                                          className="text-[var(--text-muted)] uppercase"
                                        >
                                          Remember
                                        </label>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setIsForgotPass(true)}
                                        className="text-[var(--primary)] hover:underline uppercase"
                                      >
                                        Forgot?
                                      </button>
                                    </div>
                                  </>
                                )}

                                {method === "otp" && (
                                  <>
                                    <div className="space-y-1.5">
                                      <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                        Account
                                      </label>
                                      <div className="relative group">
                                        <Mail
                                          className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors"
                                          size={16}
                                        />
                                        <input
                                          type="text"
                                          required
                                          value={email}
                                          onChange={(e) =>
                                            setEmail(e.target.value)
                                          }
                                          disabled={otpSent}
                                          className={`w-full pl-11 pr-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all ${otpSent ? "opacity-50" : ""}`}
                                          placeholder="Email or Mobile"
                                        />
                                        {otpSent && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOtpSent(false);
                                              setOtp("");
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-[var(--primary)] uppercase"
                                          >
                                            Edit
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    {otpSent && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        className="space-y-1.5"
                                      >
                                        <label className="text-[9px] font-black text-[var(--text-muted)] tracking-widest uppercase ml-1">
                                          Input Code
                                        </label>
                                        <div className="relative">
                                          <Smartphone
                                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                                            size={16}
                                          />
                                          <input
                                            type="text"
                                            required
                                            value={otp}
                                            onChange={(e) =>
                                              setOtp(e.target.value)
                                            }
                                            className="w-full pl-11 pr-4 py-3 rounded-xl bg-transparent border border-[var(--glass-border)] focus:border-[var(--primary)] outline-none text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm transition-all text-xl tracking-[0.3rem] font-black text-center"
                                            placeholder="000000"
                                            maxLength={6}
                                          />
                                        </div>
                                      </motion.div>
                                    )}
                                  </>
                                )}

                                <button
                                  disabled={loading}
                                  className="w-full py-4 bg-[var(--primary)] text-white font-black rounded-2xl hover:bg-[var(--secondary)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 uppercase text-xs tracking-[0.2rem] shadow-xl shadow-[var(--primary)]/20"
                                >
                                  {loading ? (
                                    "Wait..."
                                  ) : method === "otp" ? (
                                    otpSent ? (
                                      "Enter"
                                    ) : (
                                      "Send Code"
                                    )
                                  ) : (
                                    <>
                                      Continue <ArrowRight size={16} />
                                    </>
                                  )}
                                </button>
                                {errorMsg && (
                                  <p className="text-center text-[10px] text-red-500 font-bold p-2 bg-red-500/10 rounded-lg">
                                    {errorMsg}
                                  </p>
                                )}
                              </motion.form>
                            )}

                            {method === "qr" && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center justify-center text-center space-y-5 py-4"
                              >
                                <div className="p-4 bg-white rounded-3xl shadow-xl border-4 border-[var(--glass-border)]">
                                  {qrSession && (
                                    <QRCodeSVG value={qrSession} size={140} />
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p className="font-black text-[var(--text-main)] text-2xl font-serif-magic italic leading-tight uppercase tracking-tight">
                                    Instant Sync
                                  </p>
                                  <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest max-w-[180px]">
                                    Scan with your ARTsFellow app.
                                  </p>
                                </div>
                              </motion.div>
                            )}

                            <div className="mt-6 pt-5 border-t border-gray-200 dark:border-white/10">
                              <p className="text-center text-[9px] font-black text-[var(--text-muted)] tracking-[0.2rem] uppercase mb-4">
                                Social
                              </p>
                              <div className="flex gap-4 justify-center">
                                <button className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-[var(--primary)] hover:text-white dark:hover:bg-[var(--primary)] transition-all hover:scale-105 shadow-sm">
                                  <Github size={18} />
                                </button>
                                <button className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-white hover:bg-[#1877F2] hover:text-white transition-all hover:scale-105 shadow-sm">
                                  <Facebook size={18} />
                                </button>
                              </div>
                              <div className="mt-5 text-center text-[10px] text-[var(--text-muted)]">
                                New explorer?{" "}
                                <button
                                  onClick={() => setIsSignup(true)}
                                  className="font-black text-[var(--primary)] hover:underline uppercase tracking-tight ml-1"
                                >
                                  Create Canvas
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginTab;
