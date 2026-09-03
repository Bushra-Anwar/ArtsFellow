import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Camera,
  ShieldCheck,
  CreditCard,
  Image as ImageIcon,
  Plus,
  X,
  MapPin,
  Briefcase,
  BadgeCheck,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { artCategories } from "../constants/artCategories";
import Logo from "../components/Logo";

interface ArtworkEntry {
  title: string;
  price: string;
  medium: string;
  file: File | null;
  preview?: string;
}

const ArtistRegistration: React.FC = () => {
  const { verifySignup, sendOtp, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // OTP State
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Form Data
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    brandName: "",
    bio: "",
    category: "",
    location: "",
    experience: "",
    profilePhoto: null as File | null,
    profilePhotoPreview: "",
    idProof: null as File | null,
    idProofName: "",
    accountNumber: "",
    ifsc: "",
    upi: "",
    agreedToTerms: false,
  });

  const [artworks, setArtworks] = useState<ArtworkEntry[]>([
    { title: "", price: "", medium: "", file: null },
    { title: "", price: "", medium: "", file: null },
    { title: "", price: "", medium: "", file: null },
  ]);

  // Handle initial state if user is already logged in as customer
  useEffect(() => {
    if (user) {
      if (user.role === "customer" && step === 1) {
        setFormData((prev) => ({
          ...prev,
          fullName: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
        }));
      }
    }
  }, [user, step]);

  const handleSendOtp = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (
      !formData.email ||
      !formData.fullName ||
      (!isAuthenticated && !formData.password) ||
      !formData.phone
    ) {
      setErrorMsg("Please fill all account fields");
      return;
    }

    setIsVerifying(true);
    const res = await sendOtp(formData.email, formData.phone, false, true); // isArtistRegistration=true
    setIsVerifying(false);

    if (res.success) {
      setOtpSent(true);
      setSuccessMsg(`Verification code sent to ${formData.email}`);
    } else {
      setErrorMsg(res.message || "Failed to send verification code");
    }
  };

  const handleNext = () => {
    setErrorMsg("");
    if (step === 1) {
      if (!isAuthenticated) {
        if (!otpSent) {
          handleSendOtp();
          return;
        }
        if (!otp) {
          setErrorMsg("Please enter verification code");
          return;
        }
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.brandName || !formData.category || !formData.bio) {
        setErrorMsg("Please complete your profile information");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const validArts = artworks.filter((a) => a.file && a.title);
      if (validArts.length < 3) {
        setErrorMsg("Please upload at least 3 artworks with titles");
        return;
      }
      setStep(4);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "profilePhoto" | "idProof",
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (field === "profilePhoto") {
        setFormData({
          ...formData,
          profilePhoto: file,
          profilePhotoPreview: URL.createObjectURL(file),
        });
      } else {
        setFormData({ ...formData, idProof: file, idProofName: file.name });
      }
    }
  };

  const handleArtworkChange = (
    index: number,
    field: keyof ArtworkEntry,
    value: any,
  ) => {
    const newArtworks = [...artworks];
    if (field === "file" && value instanceof File) {
      newArtworks[index] = {
        ...newArtworks[index],
        file: value,
        preview: URL.createObjectURL(value),
      };
    } else {
      newArtworks[index] = { ...newArtworks[index], [field]: value };
    }
    setArtworks(newArtworks);
  };

  const addArtwork = () => {
    setArtworks([
      ...artworks,
      { title: "", price: "", medium: "", file: null },
    ]);
  };

  const removeArtwork = (index: number) => {
    if (artworks.length <= 3) return;
    setArtworks(artworks.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setErrorMsg("");

    if (!formData.agreedToTerms) {
      setErrorMsg("Please agree to the terms and conditions");
      return;
    }

    setIsVerifying(true);

    const payload = new FormData();
    payload.append("fullName", formData.fullName);
    payload.append("email", formData.email);
    payload.append("phone", formData.phone);
    if (formData.password) payload.append("password", formData.password);
    payload.append("otp", otp);
    payload.append("role", "artist");

    payload.append("brandName", formData.brandName);
    payload.append("bio", formData.bio);
    payload.append("category", formData.category);
    payload.append("location", formData.location);
    payload.append("experience", formData.experience);

    if (formData.profilePhoto)
      payload.append("profilePhoto", formData.profilePhoto);
    if (formData.idProof) payload.append("idProof", formData.idProof);

    payload.append("accountNumber", formData.accountNumber);
    payload.append("ifsc", formData.ifsc);
    payload.append("upi", formData.upi);

    const artworkData = artworks
      .filter((a) => a.file)
      .map((a) => ({
        title: a.title,
        price: a.price,
        medium: a.medium,
      }));
    payload.append("artworkDetails", JSON.stringify(artworkData));

    artworks.forEach((art) => {
      if (art.file) payload.append("portfolio", art.file);
    });

    const res = await verifySignup(payload);
    setIsVerifying(false);

    if (res.success) {
      setStep(5);
    } else {
      setErrorMsg(res.message || "Registration failed. Please try again.");
    }
  };

  const PaintBlobs = () => (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -top-24 -left-24 w-[450px] h-[450px] bg-[var(--color-primary)]/10 rounded-full blur-[100px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, -40, 0],
          y: [0, 50, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        className="absolute top-1/4 -right-32 w-[600px] h-[600px] bg-[#FFC107]/5 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.15, 1],
          x: [0, 50, 0],
          y: [0, -30, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-48 left-10 w-[500px] h-[500px] bg-[#FF5252]/5 rounded-full blur-[130px]"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7] relative overflow-hidden pt-12 pb-20 px-4 font-['Outfit']">
      <PaintBlobs />
      <div className="max-w-5xl mx-auto relative z-10">
        {/* Branding Top */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md p-4 rounded-3xl shadow-sm border border-white/20">
            <Logo className="h-8" />
          </div>
        </div>

        {/* Header Section */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black text-[#1a202c] dark:text-white dark:text-white uppercase tracking-[-0.04em] mb-4"
          >
            ARTIST{" "}
            <span className="text-[var(--color-primary)]">REGISTRATION</span>
          </motion.h1>
          <p className="text-[var(--text-muted)] font-medium max-w-lg mx-auto text-lg leading-relaxed">
            Your digital masterpiece begins here. Join the collective.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="flex justify-between mb-12 max-w-3xl mx-auto relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -z-10 -translate-y-1/2" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-lg ${
                step >= i
                  ? "bg-[var(--color-primary)] text-white scale-110 shadow-[var(--color-primary)]/20"
                  : "bg-white dark:bg-[#041a1a] border-2 border-slate-200 dark:border-[var(--color-primary)]/30 text-slate-400 dark:text-slate-300"
              }`}
            >
              {step > i ? <CheckCircle size={20} /> : i}
            </div>
          ))}
        </div>

        {/* Main Card Container */}
        <div className="bg-[#FCFAF7] dark:bg-[var(--card-bg)] dark:border-[var(--glass-border)] rounded-[50px] shadow-[0_40px_100px_rgba(0,0,0,0.06)] border border-white/50 p-10 md:p-16 transition-all min-h-[600px] flex flex-col relative overflow-hidden backdrop-blur-sm">
          {/* Visual Border Accent */}
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--color-primary)]/40 via-[#FF5252]/40 to-[#FFC107]/40" />

          <AnimatePresence mode="wait">
            {/* Step 1: Account Creation */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 flex-1"
              >
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="px-5 py-2 bg-[var(--color-primary)]/5 text-[var(--color-primary)] rounded-full text-[11px] font-black uppercase tracking-[0.2em] shadow-sm border border-[var(--color-primary)]/10">
                      Stage 01 — Identification
                    </div>
                    <div className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em]">
                      Artist on Canvas
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-4xl font-black text-[#1a202c] dark:text-white dark:text-white tracking-tight">
                      Create Your Studio
                    </h2>
                    <p className="text-[var(--text-muted)] font-medium text-lg leading-relaxed">
                      Join our curated community of digital creators.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-300 ml-1 tracking-widest">
                      Full Name
                    </label>
                    <input
                      type="text"
                      className="w-full p-4 rounded-2xl bg-[#F8FAFC] dark:bg-gray-800 dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-[#1a202c] dark:text-white dark:text-white dark:text-white transition-all text-sm font-medium"
                      placeholder="Enter your full legal name"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-300 ml-1 tracking-widest">
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="w-full p-4 rounded-2xl bg-[#F8FAFC] dark:bg-gray-800 dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-[#1a202c] dark:text-white dark:text-white dark:text-white transition-all text-sm font-medium"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-300 ml-1 tracking-widest">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      className="w-full p-4 rounded-2xl bg-[#F8FAFC] dark:bg-gray-800 dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-[#1a202c] dark:text-white dark:text-white dark:text-white transition-all text-sm font-medium"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-300 ml-1 tracking-widest">
                      Create Password
                    </label>
                    <input
                      type="password"
                      className="w-full p-4 rounded-2xl bg-[#F8FAFC] dark:bg-gray-800 dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-[#1a202c] dark:text-white dark:text-white dark:text-white transition-all text-sm font-medium"
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      disabled={isAuthenticated}
                    />
                  </div>
                </div>

                {otpSent && !isAuthenticated && (
                  <div className="mt-8 p-6 bg-[var(--color-primary)]/5 rounded-3xl border border-[var(--color-primary)]/10 text-center space-y-4">
                    <p className="text-sm font-bold text-[var(--color-primary)]">
                      OTP sent to {formData.email}
                    </p>
                    <div className="flex justify-center">
                      <div className="relative w-full max-w-xs">
                        <Smartphone
                          className="absolute left-6 top-1/2 -translate-y-1/2 text-[var(--color-primary)]"
                          size={20}
                        />
                        <input
                          type="text"
                          maxLength={6}
                          className="w-full pl-16 pr-6 py-5 rounded-2xl bg-white border-none shadow-xl shadow-[var(--color-primary)]/5 focus:ring-2 focus:ring-[var(--color-primary)]/20 outline-none text-3xl font-black text-center tracking-[0.8rem] text-[#1a202c] dark:text-white dark:text-white"
                          value={otp}
                          onChange={(e) => setOtp(e.target.value)}
                          placeholder="000000"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Basic Profile */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 flex-1"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-[#1a202c] dark:text-white dark:text-white flex items-center gap-2">
                    <User className="text-[var(--color-primary)]" />
                    Artist Profile
                  </h2>
                  <p className="text-[var(--text-muted)] font-medium">
                    How you'll be seen by the world.
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative group">
                      <div className="w-36 h-36 rounded-[2.5rem] bg-[#F8FAFC] dark:bg-gray-800 overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center relative">
                        {formData.profilePhotoPreview ? (
                          <img
                            src={formData.profilePhotoPreview}
                            className="w-full h-full object-cover"
                            alt="Profile"
                          />
                        ) : (
                          <Camera className="text-gray-300" size={40} />
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleFileChange(e, "profilePhoto")}
                        />
                      </div>
                      <div className="absolute -bottom-2 translate-y-1/2 left-1/2 -translate-x-1/2 bg-[var(--color-primary)] text-white p-2.5 rounded-xl shadow-lg">
                        <Camera size={16} />
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase text-[var(--text-muted)] tracking-widest">
                      Avatar
                    </span>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1 tracking-widest">
                          Artist / Brand Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Studio DaVinci"
                          className="w-full p-4 rounded-2xl bg-[#F8FAFC] dark:bg-gray-800 dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none text-[#1a202c] dark:text-white dark:text-white dark:text-white transition-all text-sm"
                          value={formData.brandName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              brandName: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1 tracking-widest">
                          Art Category
                        </label>
                        <select
                          className="w-full p-4 rounded-2xl bg-[#F8FAFC] dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none text-[#1a202c] dark:text-white dark:text-white transition-all text-sm appearance-none"
                          value={formData.category}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              category: e.target.value,
                            })
                          }
                        >
                          <option value="">Select Category</option>
                          {artCategories
                            .flatMap((g) => g.items)
                            .map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1 tracking-widest">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                            size={18}
                          />
                          <input
                            type="text"
                            placeholder="City, Country"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F8FAFC] dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none text-[#1a202c] dark:text-white dark:text-white transition-all text-sm"
                            value={formData.location}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                location: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2 text-left">
                        <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1 tracking-widest">
                          Experience
                        </label>
                        <div className="relative">
                          <Briefcase
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                            size={18}
                          />
                          <input
                            type="text"
                            placeholder="e.g. 5 Years"
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#F8FAFC] dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none text-[#1a202c] dark:text-white dark:text-white transition-all text-sm"
                            value={formData.experience}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                experience: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 text-left">
                      <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1 tracking-widest">
                        Short Bio
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Tell collectors about your style, inspiration, and background..."
                        className="w-full p-4 rounded-3xl bg-[#F8FAFC] dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none text-[#1a202c] dark:text-white dark:text-white transition-all text-sm resize-none"
                        value={formData.bio}
                        onChange={(e) =>
                          setFormData({ ...formData, bio: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Portfolio/Artworks */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8 flex-1"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-[#1a202c] dark:text-white dark:text-white flex items-center gap-2">
                    <ImageIcon className="text-[var(--color-primary)]" />
                    Showcase Portfolio
                  </h2>
                  <p className="text-[var(--text-muted)] font-medium">
                    Upload at least 3 high-quality pieces to get verified.
                  </p>
                </div>

                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-3 custom-scrollbar">
                  {artworks.map((art, idx) => (
                    <div
                      key={idx}
                      className="p-8 bg-white rounded-[3rem] border border-gray-100 relative group transition-all hover:shadow-xl"
                    >
                      <button
                        onClick={() => removeArtwork(idx)}
                        className="absolute top-6 right-6 p-2.5 bg-red-50 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={18} />
                      </button>

                      <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-48 h-48 bg-[#F8FAFC] dark:bg-gray-800 rounded-3xl border-2 border-dashed border-gray-100 overflow-hidden relative flex items-center justify-center">
                          {art.preview ? (
                            <img
                              src={art.preview}
                              className="w-full h-full object-cover"
                              alt="Art"
                            />
                          ) : (
                            <Upload className="text-gray-300" size={36} />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={(e) => {
                              if (e.target.files?.[0])
                                handleArtworkChange(
                                  idx,
                                  "file",
                                  e.target.files[0],
                                );
                            }}
                          />
                        </div>

                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">
                              Title
                            </label>
                            <input
                              type="text"
                              placeholder="Artwork Name"
                              className="w-full p-4 rounded-xl bg-[#F8FAFC] dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none text-sm text-[#1a202c] dark:text-white dark:text-white"
                              value={art.title}
                              onChange={(e) =>
                                handleArtworkChange(
                                  idx,
                                  "title",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">
                              Indicative Price
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 5,000"
                              className="w-full p-4 rounded-xl bg-[#F8FAFC] dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none text-sm text-[#1a202c] dark:text-white dark:text-white"
                              value={art.price}
                              onChange={(e) =>
                                handleArtworkChange(
                                  idx,
                                  "price",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                          <div className="space-y-2 md:col-span-2">
                            <label className="text-[10px] font-black uppercase text-[var(--text-muted)] ml-1">
                              Medium / Material
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Oil on Canvas, Digital Illustration"
                              className="w-full p-4 rounded-xl bg-[#F8FAFC] dark:bg-gray-800 border-none focus:ring-2 focus:ring-[var(--color-primary)]/10 outline-none text-sm text-[#1a202c] dark:text-white dark:text-white"
                              value={art.medium}
                              onChange={(e) =>
                                handleArtworkChange(
                                  idx,
                                  "medium",
                                  e.target.value,
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={addArtwork}
                    className="w-full py-5 border-2 border-dashed border-gray-200 rounded-[2.5rem] text-[var(--text-muted)] hover:text-[var(--color-primary)] hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all flex items-center justify-center gap-3 font-black text-[11px] uppercase tracking-widest"
                  >
                    <Plus size={20} /> Add Another Piece
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Identity & Bank */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10 flex-1"
              >
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-[#1a202c] dark:text-white dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-[var(--color-primary)]" />
                    Verification & Payments
                  </h2>
                  <p className="text-[var(--text-muted)] font-medium">
                    Secure your identity and setup your income streams.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* ID Verification */}
                  <div className="space-y-6">
                    <div className="p-10 border-2 border-dashed border-gray-200 rounded-[3rem] bg-[#F8FAFC] dark:bg-gray-800 text-center space-y-6">
                      <div className="w-20 h-20 bg-white dark:bg-[#092b2b] rounded-3xl flex items-center justify-center mx-auto shadow-sm">
                        {formData.idProof ? (
                          <CheckCircle className="text-emerald-500" size={40} />
                        ) : (
                          <BadgeCheck className="text-gray-200" size={40} />
                        )}
                      </div>
                      <div>
                        <p className="text-xl font-black text-[#1a202c] dark:text-white dark:text-white">
                          Identity Proof (Optional)
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] uppercase tracking-widest mt-2">
                          Aadhar, PAN or Passport (PDF/JPG)
                        </p>
                      </div>
                      <label className="flex items-center justify-center px-8 py-4 bg-[var(--color-primary)] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest cursor-pointer hover:shadow-xl transition-all mx-auto w-fit">
                        {formData.idProof
                          ? "Replace Document"
                          : "Upload ID Proof"}
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,image/*"
                          onChange={(e) => handleFileChange(e, "idProof")}
                        />
                      </label>
                      {formData.idProofName && (
                        <p className="text-xs font-bold text-[var(--color-primary)] flex items-center justify-center gap-2 bg-[var(--color-primary)]/5 py-2 px-4 rounded-full mx-auto w-fit">
                          <CheckCircle size={16} /> {formData.idProofName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bank Details */}
                  <div className="bg-[#1a202c] rounded-[3rem] p-10 space-y-8 text-white overflow-hidden relative shadow-2xl">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--color-primary)]/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                    <div className="flex items-center gap-4 mb-4">
                      <CreditCard
                        className="text-[var(--color-primary)]"
                        size={28}
                      />
                      <h3 className="font-black uppercase tracking-widest text-[11px]">
                        Payout Information
                      </h3>
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">
                          Bank Account Number (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="XXXX XXXX XXXX XXXX"
                          className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-primary)] outline-none text-white text-base font-mono tracking-widest"
                          value={formData.accountNumber}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              accountNumber: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">
                            IFSC Code (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="SBIN00XXXX"
                            className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-primary)] outline-none text-white text-sm font-mono uppercase"
                            value={formData.ifsc}
                            onChange={(e) =>
                              setFormData({ ...formData, ifsc: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest ml-1">
                            UPI ID (Optional)
                          </label>
                          <input
                            type="text"
                            placeholder="name@upi"
                            className="w-full p-5 rounded-2xl bg-white/5 border border-white/10 focus:border-[var(--color-primary)] outline-none text-white text-sm"
                            value={formData.upi}
                            onChange={(e) =>
                              setFormData({ ...formData, upi: e.target.value })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Terms */}
                <div className="p-8 bg-white/50 dark:bg-[#092b2b]/50 dark:border-[var(--glass-border)] rounded-[2.5rem] border border-gray-100 backdrop-blur-sm">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-1">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={formData.agreedToTerms}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            agreedToTerms: e.target.checked,
                          })
                        }
                      />
                      <div className="w-6 h-6 border-2 border-gray-200 rounded-lg group-hover:border-[var(--color-primary)] transition-colors peer-checked:bg-[var(--color-primary)] peer-checked:border-[var(--color-primary)] flex items-center justify-center">
                        <CheckCircle
                          size={14}
                          className="text-white opacity-0 peer-checked:opacity-100 transition-opacity"
                        />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-black text-[#1a202c] dark:text-white dark:text-white">
                        Agree to Terms & Commission Policy
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)] leading-relaxed font-medium">
                        I agree to the platform's{" "}
                        <span className="text-[var(--color-primary)] font-black">
                          20% commission policy
                        </span>{" "}
                        on sales. I confirm that all artworks uploaded are my
                        original creations and I hold full copyrights for the
                        same.
                      </p>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* Step 5: Success/Under Review */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-20 space-y-10 flex flex-col items-center justify-center flex-1"
              >
                <div className="w-36 h-36 bg-emerald-50 text-emerald-500 rounded-[3.5rem] flex items-center justify-center animate-bounce shadow-xl shadow-emerald-500/10">
                  <CheckCircle size={72} />
                </div>
                <div className="space-y-4 max-w-md">
                  <h2 className="text-5xl font-black text-[#1a202c] dark:text-white dark:text-white uppercase tracking-[-0.04em]">
                    Under Review
                  </h2>
                  <p className="text-[var(--text-muted)] text-lg leading-relaxed font-medium">
                    Fantastic! Your artist profile has been submitted
                    successfully and is now <b>Pending Approval</b>.
                  </p>
                  <div className="p-8 bg-[var(--color-primary)]/5 text-[var(--color-primary)] rounded-[2.5rem] font-bold text-sm border border-[var(--color-primary)]/10 leading-relaxed">
                    We've sent a confirmation email. Our curation team typically
                    reviews applications within 24-48 business hours.
                  </div>
                </div>
                <button
                  onClick={() => navigate("/")}
                  className="px-14 py-6 bg-[#1a202c] text-white font-black rounded-[2rem] hover:shadow-2xl hover:-translate-y-1 transition-all uppercase text-[11px] tracking-[0.3em] flex items-center gap-4"
                >
                  Back to Gallery
                  <ArrowRight size={20} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Actions */}
          {step < 5 && (
            <div className="flex justify-between items-center pt-12 border-t border-gray-100 mt-12 relative z-10">
              <button
                onClick={() => setStep(step - 1)}
                disabled={step === 1 || isVerifying}
                className={`flex items-center gap-2 px-8 py-4 font-black text-[var(--text-muted)] hover:text-[#1a202c] dark:text-white dark:text-white transition-all uppercase text-[11px] tracking-widest ${step === 1 ? "opacity-0 pointer-events-none" : ""}`}
              >
                <ArrowLeft size={20} /> Prev
              </button>

              <div className="flex flex-col items-end gap-3">
                <button
                  onClick={step === 4 ? handleSubmit : handleNext}
                  disabled={isVerifying}
                  className="px-14 py-6 bg-[var(--color-primary)] text-white font-black rounded-[2rem] hover:shadow-[0_25px_50px_rgba(63,154,174,0.3)] hover:-translate-y-1 transition-all disabled:opacity-50 flex items-center gap-4 uppercase text-[11px] tracking-[0.3em]"
                >
                  {isVerifying
                    ? "Processing..."
                    : step === 4
                      ? "Submit Studio"
                      : "Continue"}
                  {!isVerifying && <ArrowRight size={22} />}
                </button>
                {errorMsg && (
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest bg-red-50 px-4 py-2 rounded-full">
                    {errorMsg}
                  </p>
                )}
                {successMsg && (
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full">
                    {successMsg}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArtistRegistration;
