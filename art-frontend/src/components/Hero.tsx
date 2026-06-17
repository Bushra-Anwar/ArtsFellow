import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Frame, Palette } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import { ArtworkService } from "../services/artwork.service";
import "./hero.css";

const normalizeImage = (art: any) => {
  const image = art.images?.[0];
  if (!image) return "/art_feature_image.png";
  if (image.startsWith("http")) return image;
  return image.startsWith("/") ? `http://localhost:5005${image}` : `http://localhost:5005/${image}`;
};

export default function Hero() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const [artworks, setArtworks] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await ArtworkService.getAllArtworks();
        if (res.status === "ok" && res.artworks) {
          setArtworks(res.artworks.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, []);

  const img1 = artworks[0] ? normalizeImage(artworks[0]) : "https://images.unsplash.com/photo-1549887534-3ec93abae84b?auto=format&fit=crop&w=500&q=80";
  const img2 = artworks[1] ? normalizeImage(artworks[1]) : "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?auto=format&fit=crop&w=500&q=80";
  const img3 = artworks[2] ? normalizeImage(artworks[2]) : "https://images.unsplash.com/photo-1504198453319-5ce911bafcde?auto=format&fit=crop&w=500&q=80";
  const img4 = artworks[3] ? normalizeImage(artworks[3]) : "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=500&q=80";

  // Cursor tracking for interactive live background hover animation
  const cursorX = useMotionValue(-1000);
  const cursorY = useMotionValue(-1000);
  const springConfig = { stiffness: 30, damping: 20, mass: 0.5 };
  const smoothX = useSpring(cursorX, springConfig);
  const smoothY = useSpring(cursorY, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    // 300 is half the width/height of the 600px orb so it centers perfectly on cursor
    cursorX.set(e.clientX - 300);
    cursorY.set(e.clientY - 300);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative min-h-screen w-full flex items-center justify-center overflow-hidden transition-colors duration-700 ${isDarkMode ? "dark bg-transparent" : "bg-transparent"}`}
    >

      {/* 🔮 INTERACTIVE CURSOR GLOW ORB (Follows mouse) */}
      <motion.div
        className={`fixed top-0 left-0 w-[600px] h-[600px] rounded-full blur-[160px] pointer-events-none z-0 transition-opacity duration-500 ${isDarkMode ? "bg-teal-500/30" : "bg-emerald-300/40"}`}
        style={{ x: smoothX, y: smoothY }}
      />

      {/* 🔥 LIVE ANIMATED BACKGROUND BLOBS (Autonomous) */}
      <motion.div
        className="absolute w-[600px] h-[600px] md:w-[800px] md:h-[800px] bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full blur-[140px] opacity-20 pointer-events-none"
        animate={{ x: [0, 400, -200, 0], y: [0, -300, 200, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[500px] h-[500px] md:w-[600px] md:h-[600px] bg-gradient-to-r from-blue-400 to-cyan-300 rounded-full blur-[140px] opacity-20 pointer-events-none"
        animate={{ x: [0, -300, 200, 0], y: [0, 200, -200, 0], scale: [1, 1.3, 0.8, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 🧊 LEFT ANIMATED GEOMETRIC OBJECT */}
      <motion.div
        className={`absolute left-[-5%] md:left-[5%] top-[35%] w-[100px] h-[100px] md:w-[160px] md:h-[160px] border-2 border-teal-500/30 pointer-events-none z-0 backdrop-blur-md ${isDarkMode ? "bg-teal-500/5 shadow-[0_0_30px_rgba(20,184,166,0.15)]" : "bg-black/5 shadow-[0_0_30px_rgba(0,0,0,0.05)]"}`}
        animate={{
          y: [0, -80, 0],
          rotate: [0, 180, 360],
          borderRadius: ["30%", "50%", "20%", "30%"]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* 🧊 RIGHT ANIMATED GEOMETRIC OBJECT */}
      <motion.div
        className={`absolute right-[-5%] md:right-[5%] bottom-[25%] w-[80px] h-[80px] md:w-[130px] md:h-[130px] border border-blue-400/40 pointer-events-none z-0 backdrop-blur-md ${isDarkMode ? "bg-blue-400/5 shadow-[0_0_30px_rgba(96,165,250,0.15)]" : "bg-black/5 shadow-[0_0_30px_rgba(0,0,0,0.05)]"}`}
        animate={{
          y: [0, 60, 0],
          rotate: [360, 180, 0],
          borderRadius: ["50%", "20%", "40%", "50%"]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* Background watermark text carefully fading into background */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[clamp(4.5rem,13vw,11rem)] font-sans font-black tracking-widest uppercase whitespace-nowrap pointer-events-none select-none z-0 transition-colors duration-700 ${isDarkMode ? "text-white/[0.03]" : "text-black/[0.03]"}`} aria-hidden="true">
        CREATIVITY
      </div>
      <div className={`absolute bottom-[4%] left-1/2 -translate-x-1/2 text-[clamp(1.5rem,5.5vw,4.5rem)] font-sans font-black tracking-[0.2em] uppercase whitespace-nowrap pointer-events-none select-none z-0 transition-colors duration-700 ${isDarkMode ? "text-white/[0.03]" : "text-black/[0.04]"}`} aria-hidden="true">
        WELCOME TO THE STUDIO
      </div>

      {/* ─── IMAGE POSITIONS AS EXACTLY REQUESTED ─── */}
      {/* 🖼 LEFT TOP IMAGE */}
      <motion.div
        initial={{ opacity: 0, x: -60, y: 30 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05, y: -10, zIndex: 50 }}
        className="absolute left-[2%] sm:left-12 lg:left-[15%] top-16 w-[180px] h-[260px] md:w-[260px] md:h-[400px] rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer"
        onClick={() => artworks[0] && navigate(`/art/${artworks[0]._id}`)}
      >
        <img src={img1} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Featured 1" />
      </motion.div>

      {/* 🖼 LEFT BOTTOM IMAGE */}
      <motion.div
        initial={{ opacity: 0, x: -60, y: 30 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.9, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05, y: -10, zIndex: 50 }}
        className="absolute left-[10%] sm:left-[15%] lg:left-[18%] bottom-[5%] sm:bottom-[8%] w-[200px] h-[280px] md:w-[300px] md:h-[440px] rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer z-20"
        onClick={() => artworks[1] && navigate(`/art/${artworks[1]._id}`)}
      >
        <img src={img2} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Featured 2" />
      </motion.div>

      {/* 🖼 RIGHT TOP IMAGE */}
      <motion.div
        initial={{ opacity: 0, x: 60, y: 30 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05, y: -10, zIndex: 50 }}
        className="absolute right-[4%] sm:right-16 lg:right-[10%] top-24 md:top-28 w-[190px] h-[250px] md:w-[280px] md:h-[400px] rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer"
        onClick={() => artworks[2] && navigate(`/art/${artworks[2]._id}`)}
      >
        <img src={img3} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Featured 3" />
      </motion.div>

      {/* 🖼 RIGHT BOTTOM IMAGE */}
      <motion.div
        initial={{ opacity: 0, x: 60, y: 30 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.9, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 1.05, y: -10, zIndex: 50 }}
        className="absolute right-[8%] sm:right-[15%] lg:right-[16%] bottom-16 sm:bottom-20 w-[200px] h-[270px] md:w-[300px] md:h-[420px] rounded-2xl md:rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer z-20"
        onClick={() => artworks[3] && navigate(`/art/${artworks[3]._id}`)}
      >
        <img src={img4} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Featured 4" />
      </motion.div>

      {/* ─── CENTER CONTENT MATCHING THE SCREENSHOT EXACTLY ─── */}
      <div className="relative z-30 text-center flex flex-col items-center justify-center max-w-4xl px-4 mt-8 md:mt-0 font-sans">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="flex flex-col items-center gap-6"
        >
          {/* Pill Badge matching screenshot */}
          <div className={`px-5 py-2 md:px-6 md:py-2.5 rounded-full border ${isDarkMode ? "border-white/10 bg-white/5" : "border-black/10 bg-black/5"} flex items-center justify-center`}>
            <span className={`text-[10px] md:text-xs font-bold tracking-[0.25em] md:tracking-[0.35em] uppercase ${isDarkMode ? "text-white/80" : "text-slate-500"}`}>
              DIGITAL ART RENAISSANCE
            </span>
          </div>

          {/* Main Title matching screenshot (Sans-Serif, Ultra-Bold, Italic) */}
          <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[7.5rem] leading-none font-black italic tracking-tighter flex items-center justify-center mt-2 mb-2 z-10 relative">
            <span className={isDarkMode ? "text-white" : "text-[#0f172a]"}>ARTS</span>
            <span className="hero-title-accent">FELLOW</span>
          </h1>

          {/* Subtitle */}
          <p className={`text-sm sm:text-base md:text-lg font-medium mx-auto px-4 ${isDarkMode ? "text-gray-300" : "text-slate-600"}`} style={{ maxWidth: "600px", lineHeight: "1.6" }}>
            The professional studio collective where legacy meets the digital canvas.
          </p>

          {/* CTA Buttons - Matching exactly the styling in the screenshot */}
          <div className="flex flex-row gap-4 mt-8 justify-center items-center font-sans font-bold">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (!isAuthenticated) {
                  window.dispatchEvent(new CustomEvent("open-login-modal"));
                } else {
                  navigate("/explore");
                }
              }}
              className={`flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-4 rounded-full text-xs font-black tracking-[0.15em] uppercase transition-all shadow-xl ${isDarkMode
                  ? "bg-white text-black hover:bg-gray-200"
                  : "bg-[#0a0f1c] text-white hover:bg-black"
                }`}
            >
              <Frame size={16} strokeWidth={2.5} />
              EXPLORE COLLECTION
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/register-artist")}
              className={`flex items-center justify-center gap-3 px-8 md:px-10 py-4 md:py-4 rounded-full border-2 text-xs font-bold tracking-[0.15em] uppercase transition-all ${isDarkMode
                  ? "border-white/30 text-white hover:bg-white/10"
                  : "border-[#0a0f1c]/20 text-[#0f172a] hover:bg-black/5"
                }`}
            >
              <Palette size={16} strokeWidth={2.5} />
              JOIN AS ARTIST
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
