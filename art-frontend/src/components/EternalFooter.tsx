import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Truck, Headphones, RotateCcw, ShieldCheck,
  Mail, MapPin, Phone, Globe,
  Instagram, Twitter, Facebook, Linkedin, Youtube,
  ArrowRight, Sparkles, Heart
} from "lucide-react";

const EternalFooter: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [secretActivated, setSecretActivated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 4000);
      setEmail("");
    }
  };

  // Trust badges data
  const trustBadges = [
    { icon: Truck, title: "FREE SHIPPING", desc: "Free shipping on all orders above ₹500", color: "#8B5CF6", delay: 0 },
    { icon: Headphones, title: "SUPPORT 24/7", desc: "Contact us 24 hours a day, 7 days a week", color: "#06B6D4", delay: 0.1 },
    { icon: RotateCcw, title: "30 DAYS RETURN", desc: "Simply return it within 30 days for an exchange", color: "#10B981", delay: 0.2 },
    { icon: ShieldCheck, title: "100% SECURE", desc: "We ensure secure payment with blockchain verification", color: "#EAB308", delay: 0.3 },
  ];

  const footerLinks = {
    categories: [
      { label: "Privacy Policy", path: "/privacy" },
      { label: "Terms & Conditions", path: "/terms" },
      { label: "Shipping Policy", path: "/shipping" },
      { label: "Refund Policy", path: "/refund" },
      { label: "Contact Information", path: "/contact" },
    ],
    useful: [
      { label: "About us", path: "/about" },
      { label: "Blogs", path: "/blogs" },
      { label: "Contact", path: "/contact" },
      { label: "Artists", path: "/artists" },
      { label: "Custom Art", path: "/custom" },
    ]
  };

  const socials = [
    { icon: Facebook, label: "Facebook", color: "#1877F2" },
    { icon: Twitter, label: "Twitter", color: "#1DA1F2" },
    { icon: Instagram, label: "Instagram", color: "#E4405F" },
    { icon: Linkedin, label: "LinkedIn", color: "#0A66C2" },
    { icon: Youtube, label: "YouTube", color: "#FF0000" },
  ];

  return (
    <footer className="relative w-full overflow-hidden select-none">

      {/* ═══════ TRUST BADGES — Floating Holographic Glass Cards ═══════ */}
      <div className="relative z-10 border-t border-white/10 bg-gradient-to-b from-white via-slate-50 to-slate-100 dark:from-[#060a0c] dark:via-[#080e12] dark:to-[#050810] py-10 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustBadges.map((badge, i) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 40, rotateX: 15 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ delay: badge.delay, duration: 0.7, type: "spring" }}
              whileHover={{ y: -8, scale: 1.03, rotateY: 5 }}
              className="group relative bg-white/60 dark:bg-white/[0.04] backdrop-blur-2xl border border-white/30 dark:border-white/10 rounded-[2rem] p-6 flex flex-col items-center text-center shadow-lg hover:shadow-2xl transition-all duration-500 cursor-default overflow-hidden"
              style={{ perspective: "1000px" }}
            >
              {/* Holographic glow ring behind icon */}
              <div
                className="absolute top-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-40 blur-2xl transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: badge.color }}
              />

              {/* Glass icon container */}
              <motion.div
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 20 + i * 5, repeat: Infinity, ease: "linear" }}
                className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-white/80 to-white/20 dark:from-white/10 dark:to-white/[0.02] backdrop-blur-xl border border-white/40 dark:border-white/10 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-xl transition-shadow"
                style={{ transformStyle: "preserve-3d" }}
              >
                <badge.icon
                  size={28}
                  strokeWidth={1.5}
                  className="transition-colors duration-500"
                  style={{ color: badge.color }}
                />
              </motion.div>

              <h4 className="text-xs font-black tracking-[0.3em] uppercase text-slate-800 dark:text-white mb-2 transition-colors group-hover:text-[var(--color-primary)]">
                {badge.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[200px]">
                {badge.desc}
              </p>

              {/* Subtle border glow on hover */}
              <div
                className="absolute inset-0 rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ boxShadow: `inset 0 0 30px ${badge.color}15, 0 0 20px ${badge.color}10` }}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ═══════ BRAND STORY — Chronicles Summary ═══════ */}
      <div className="relative z-10 border-t border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[#060a0c] py-6 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto text-center px-8 py-4"
        >
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-300/80 leading-[1.8] font-serif-magic italic">
            ARTsFellow is a visionary hybrid art platform — online and beyond — curating original artworks and limited edition prints by emerging and established artists from across the globe.
            We help art lovers, collectors, corporates, and interior designers discover meaningful art with cultural depth, artistic integrity, and long-term value.
          </p>
        </motion.div>
      </div>

      {/* ═══════ THE ETERNAL HORIZON — Main Footer ═══════ */}
      <div className="relative z-0">
        {/* Cosmic Nebula Background */}
        <div className="absolute inset-0 bg-slate-100 dark:bg-[#03060a] overflow-hidden pointer-events-none">
          {/* Moving nebula layers */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 3, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-tr from-purple-900/30 via-blue-900/20 to-teal-900/30 mix-blend-screen"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], rotate: [0, -2, 0] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-bl from-indigo-900/20 via-transparent to-pink-900/20 mix-blend-screen"
          />

          {/* Star field */}
          {[...Array(40)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{ duration: 2 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 5 }}
              className="absolute w-[2px] h-[2px] bg-white rounded-full"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
            />
          ))}

          {/* Gradient mesh overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#03060a] via-transparent to-[#03060a]/80 hidden dark:block" />
        </div>

        <div className="relative z-10 pt-14 pb-8 px-6 md:px-12">
          <div className="max-w-7xl mx-auto">

            {/* Main Grid: Contact | Categories | Useful Links | Newsletter */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">

              {/* Column 1: Contact & Location */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <h3 className="text-[10px] font-black tracking-[0.5em] text-[var(--color-primary)] uppercase mb-8 flex items-center gap-2">
                  <Globe size={12} /> Headquarters
                </h3>
                <div className="space-y-5">
                  <div className="flex items-start gap-3 group cursor-default">
                    <MapPin size={16} className="text-slate-400 dark:text-white/30 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0 mt-0.5" />
                    <p className="text-[12px] text-slate-600 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white/70 transition-colors leading-relaxed">
                      ARTsFellow Platform,<br />Digital Art District,<br />Gujarat, India
                    </p>
                  </div>
                  <div className="flex items-center gap-3 group cursor-default">
                    <Mail size={16} className="text-slate-400 dark:text-white/30 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                    <span className="text-[12px] text-slate-600 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white/70 transition-colors">contact@artsfellow.com</span>
                  </div>
                  <div className="flex items-center gap-3 group cursor-default">
                    <Phone size={16} className="text-slate-400 dark:text-white/30 group-hover:text-[var(--color-primary)] transition-colors flex-shrink-0" />
                    <span className="text-[12px] text-slate-600 dark:text-white/50 group-hover:text-slate-900 dark:group-hover:text-white/70 transition-colors">+91 99564 45560</span>
                  </div>
                </div>
              </motion.div>

              {/* Column 2: Categories */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-[10px] font-black tracking-[0.5em] text-[var(--color-primary)] uppercase mb-8">
                  Categories
                </h3>
                <ul className="space-y-4">
                  {footerLinks.categories.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => navigate(link.path)}
                        className="group relative text-[12px] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center gap-2"
                      >
                        {/* Paint drop hover motif */}
                        <span className="w-0 group-hover:w-2 h-2 rounded-full bg-[var(--color-primary)] transition-all duration-300 opacity-0 group-hover:opacity-100" />
                        <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Column 3: Useful Links */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
              >
                <h3 className="text-[10px] font-black tracking-[0.5em] text-[var(--color-primary)] uppercase mb-8">
                  Useful Links
                </h3>
                <ul className="space-y-4">
                  {footerLinks.useful.map((link) => (
                    <li key={link.label}>
                      <button
                        onClick={() => navigate(link.path)}
                        className="group relative text-[12px] text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white transition-all duration-300 flex items-center gap-2"
                      >
                        <span className="w-0 group-hover:w-2 h-2 rounded-full bg-[var(--color-primary)] transition-all duration-300 opacity-0 group-hover:opacity-100" />
                        <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Column 4: Portal Newsletter */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-[10px] font-black tracking-[0.5em] text-[var(--color-primary)] uppercase mb-8 flex items-center gap-2">
                  <Sparkles size={12} /> Newsletter Signup
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-white/40 leading-relaxed mb-6">
                  Subscribe to our newsletter and get access to all the latest collections, exclusive drops, and artist features.
                </p>

                {/* Portal Input Field */}
                <form onSubmit={handleSubscribe} className="relative group">
                  {/* Glow ring */}
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--color-primary)]/30 via-purple-500/20 to-[var(--color-primary)]/30 opacity-0 group-focus-within:opacity-100 blur-lg transition-all duration-700" />

                  <div className="relative flex items-center bg-slate-100 dark:bg-white/[0.04] backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden group-focus-within:border-[var(--color-primary)]/40 transition-all duration-500">
                    <input
                      ref={inputRef}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter email address"
                      className="flex-1 bg-transparent px-5 py-4 text-[11px] text-slate-800 dark:text-white font-bold tracking-wider outline-none placeholder:text-slate-300 dark:placeholder:text-white/20"
                    />
                    <button
                      type="submit"
                      className="relative mr-2 px-5 py-2.5 bg-[var(--color-primary)] text-white text-[10px] font-black tracking-widest uppercase rounded-xl hover:brightness-125 transition-all shadow-[0_0_20px_rgba(32,178,170,0.3)] hover:shadow-[0_0_30px_rgba(32,178,170,0.5)] flex items-center gap-2"
                    >
                      {subscribed ? (
                        <>
                          <Sparkles size={12} className="animate-pulse" /> Subscribed
                        </>
                      ) : (
                        <>
                          Subscribe <ArrowRight size={12} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Energy particles on focus */}
                  {email && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      {[...Array(6)].map((_, i) => (
                        <motion.div
                          key={i}
                          animate={{
                            x: [0, 200 + i * 30],
                            opacity: [0.8, 0],
                            scale: [1, 0.3]
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                          className="absolute left-4 w-1.5 h-1.5 bg-[var(--color-primary)] rounded-full"
                          style={{ top: `${30 + i * 8}%` }}
                        />
                      ))}
                    </div>
                  )}
                </form>
              </motion.div>
            </div>

            {/* Social Icons — Ink-to-Color Transition */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex justify-center gap-4 mb-12"
            >
              {socials.map((social) => (
                <motion.button
                  key={social.label}
                  whileHover={{ scale: 1.2, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className="group relative w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 flex items-center justify-center hover:border-slate-400 dark:hover:border-white/30 transition-all duration-500 overflow-hidden"
                  title={social.label}
                >
                  {/* Color flood on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at center, ${social.color}20, transparent 70%)` }}
                  />
                  <social.icon
                    size={18}
                    className="relative z-10 text-slate-400 dark:text-white/30 group-hover:text-slate-900 dark:group-hover:text-white transition-colors duration-500"
                    style={{ filter: "grayscale(100%)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = "grayscale(0%)", e.currentTarget.style.color = social.color)}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = "grayscale(100%)", e.currentTarget.style.color = "")}
                  />
                </motion.button>
              ))}
            </motion.div>

            {/* Festival Diya Silhouette Strip */}
            <div className="relative w-full h-12 mb-8 overflow-hidden opacity-30">
              <div className="absolute inset-0 flex items-center justify-center gap-8">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ opacity: [0.3, 0.7, 0.3], y: [0, -3, 0] }}
                    transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
                    className="text-amber-500/50 text-lg"
                  >
                    🪔
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Sliding Sale Ticker */}
            <div className="relative w-full overflow-hidden border-t border-b border-white/5 py-3 mb-8">
              <motion.div
                animate={{ x: ["0%", "-50%"] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                className="flex gap-16 whitespace-nowrap"
              >
                {[...Array(6)].map((_, i) => (
                  <span key={i} className="flex items-center gap-16 text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 dark:text-white/20">
                    <span className="text-[var(--color-primary)]/40">✦</span> Original Art
                    <span className="text-amber-500/40">✦</span> Festival Collection
                    <span className="text-[var(--color-primary)]/40">✦</span> Free Shipping
                    <span className="text-purple-500/40">✦</span> Certified Authentic
                    <span className="text-[var(--color-primary)]/40">✦</span> Global Artists
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Bottom Bar: Copyright + Secret Easter Egg */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="text-center md:text-left">
                <p className="text-slate-500 dark:text-white/30 text-[11px] font-medium">
                  &copy; {new Date().getFullYear()} <span className="text-[var(--color-primary)]/60 font-bold">ARTsFellow</span>. All rights reserved.
                </p>
                <p className="text-slate-400 dark:text-white/15 text-[9px] italic mt-1">
                  Empowering original art and visionary artists across the globe.
                </p>
              </div>

              <div className="flex items-center gap-6">
                <span className="text-slate-400 dark:text-white/15 text-[9px] uppercase tracking-widest">Made with</span>
                <Heart size={10} className="text-red-500/60 animate-pulse" />
                <span className="text-slate-400 dark:text-white/15 text-[9px] uppercase tracking-widest">in India</span>

                {/* Secret "System Authorized" Easter Egg */}
                <button
                  onClick={() => {
                    setSecretActivated(true);
                    setTimeout(() => setSecretActivated(false), 3000);
                  }}
                  className="ml-8 text-[7px] text-slate-200 dark:text-white/5 hover:text-slate-500 dark:hover:text-white/20 transition-colors uppercase tracking-widest cursor-default"
                >
                  ◆
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Secret "System Authorized" Overlay */}
      {secretActivated && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none"
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          <motion.div
            initial={{ scale: 0.5, rotateY: 90 }}
            animate={{ scale: 1, rotateY: 0 }}
            transition={{ type: "spring", damping: 15 }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, ease: "linear" }}
              className="w-24 h-24 border-2 border-[var(--color-primary)]/60 rounded-full flex items-center justify-center"
            >
              <ShieldCheck size={40} className="text-[var(--color-primary)]" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-[var(--color-primary)] font-black text-2xl tracking-[0.3em] uppercase"
            >
              SYSTEM AUTHORIZED
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.8 }}
              className="text-white/40 text-[10px] tracking-[0.5em] uppercase font-mono"
            >
              ACCESS LEVEL: CURATOR ▪ PROTOCOL: ACTIVE
            </motion.p>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "200px" }}
              transition={{ delay: 1, duration: 1 }}
              className="h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent"
            />
          </motion.div>
        </motion.div>
      )}
    </footer>
  );
};

export default EternalFooter;
