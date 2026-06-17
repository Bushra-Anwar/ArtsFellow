import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Palette, ShoppingBag, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import LoginTab from "../components/LoginTab";
import Logo from "../components/Logo";

const ArtLandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { } = useAuth();
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined" && localStorage.getItem("theme")) {
      return localStorage.getItem("theme");
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme as string);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Images for floating art (matching the uploaded image layout)
  const artPieces = [
    {
      src: "/src/assets/images/explore_1.png",
      top: "10%",
      left: "5%",
      width: "220px",
      delay: 0,
    },
    {
      src: "/src/assets/images/explore_2.png",
      top: "15%",
      right: "5%",
      width: "260px",
      delay: 0.2,
    },
    {
      src: "/src/assets/images/explore_3.png",
      bottom: "5%",
      left: "15%",
      width: "240px",
      delay: 0.4,
    },
    {
      src: "/src/assets/images/explore_4.png",
      top: "50%",
      right: "10%",
      width: "260px",
      delay: 0.6,
    },
  ];

  return (
    <div
      className={`min-h-screen w-full flex flex-col items-center justify-center overflow-hidden transition-colors duration-500 ${theme === "dark" ? "bg-[#05070a] text-white" : "bg-[#f8fafc] text-[#1a202c]"}`}
    >
      {/* --- HEADER --- */}
      <header className="fixed top-0 left-0 right-0 p-6 flex justify-between items-center z-50 px-8 md:px-12">
        <div className="flex items-center gap-4">
          <Logo className="h-10" />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-3 rounded-full bg-white/10 dark:bg-transparent/10 backdrop-blur-md border border-white/10 dark:border-white/5 shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 text-current"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="relative">
            <LoginTab />
          </div>
        </div>
      </header>

      {/* --- 3D SCENE BACKGROUND --- */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden transform-gpu"
        style={{ perspective: "2000px" }}
      >
        <motion.div
          className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] rounded-[10px_100px_10px_100px] blur-[30px] opacity-[0.4] dark:opacity-[0.3]"
          style={{ background: "linear-gradient(135deg, #00e091, #0061e0)" }}
          animate={{
            transform: [
              "translate3d(-10vw, -10vh, -400px) rotateX(0deg) rotateY(0deg) scale(0.8)",
              "translate3d(20vw, 20vh, 300px) rotateX(180deg) rotateY(180deg) scale(1.4)",
              "translate3d(-10vw, -10vh, -400px) rotateX(360deg) rotateY(360deg) scale(0.8)",
            ],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full blur-[40px] opacity-[0.3] dark:opacity-[0.2]"
          style={{ background: "linear-gradient(135deg, #0061e0, #00e091)" }}
          animate={{
            transform: [
              "translate3d(10vw, 10vh, -300px) rotateX(0deg) rotateY(0deg) scale(0.9)",
              "translate3d(-20vw, -20vh, 200px) rotateX(-180deg) rotateY(-180deg) scale(1.2)",
              "translate3d(10vw, 10vh, -300px) rotateX(-360deg) rotateY(-360deg) scale(0.9)",
            ],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* --- FLOATING ART PIECES --- */}
      <div className="absolute inset-0 z-10 w-full h-full">
        {artPieces.map((art, idx) => (
          <motion.div
            key={idx}
            className="absolute cursor-pointer shadow-2xl rounded-2xl overflow-hidden border border-white/10 group active:scale-95 transition-transform"
            style={{
              width: art.width,
              top: art.top,
              left: art.left,
              right: art.right,
              bottom: art.bottom,
              zIndex: 15,
            }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: [0, -25, 0],
              rotateY: [-8, 8, -8],
              rotateX: [6, -6, 6],
            }}
            transition={{
              opacity: { duration: 1, delay: art.delay },
              y: { duration: 8 + idx * 2, repeat: Infinity, ease: "easeInOut" },
              rotateY: {
                duration: 10 + idx,
                repeat: Infinity,
                ease: "easeInOut",
              },
              rotateX: {
                duration: 12 + idx,
                repeat: Infinity,
                ease: "easeInOut",
              },
            }}
            onClick={() =>
              window.dispatchEvent(new CustomEvent("open-login-modal"))
            }
          >
            <img
              src={art.src}
              alt={`Art Piece ${idx + 1}`}
              className="w-full h-auto brightness-90 group-hover:brightness-110 transition-all duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>

      {/* --- CENTRAL MAIN CONTENT --- */}
      <div className="relative z-20 flex flex-col items-center text-center max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="flex flex-col items-center"
        >
          {/* Digital Art Renaissance Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6 px-6 py-2 rounded-full border border-[var(--primary)]/20 bg-transparent/20 dark:bg-white/5 backdrop-blur-xl"
          >
            <span className="text-[11px] uppercase tracking-[0.4em] font-bold text-[var(--primary)]">
              Digital Art Renaissance
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl lg:text-[7rem] font-black mb-6 leading-[0.9] tracking-tighter flex justify-center items-baseline uppercase italic">
            <span className="text-current">Arts</span>
            <span className="text-[var(--primary)]">Fellow</span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl opacity-60 font-light mb-12 max-w-2xl leading-relaxed">
            The professional studio collective where legacy meets the digital
            canvas.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="group px-6 py-1.5 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300"
              style={{
                backgroundColor: theme === "dark" ? "white" : "#05070a",
                color: theme === "dark" ? "black" : "white",
                boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
              }}
              onClick={() =>
                window.dispatchEvent(new CustomEvent("open-login-modal"))
              }
            >
              <ShoppingBag size={18} />
              EXPLORE COLLECTION
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-1.5 rounded-full font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 border-2"
              style={{
                backgroundColor: "transparent",
                borderColor: theme === "dark" ? "white" : "#05070a",
                color: theme === "dark" ? "white" : "#05070a",
              }}
              onClick={() => navigate("/register-artist")}
            >
              <Palette size={18} />
              JOIN AS ARTIST
            </motion.button>
          </div>
        </motion.div>
      </div>

      {/* --- BACKGROUND SCROLLING TEXT --- */}
      <div className="fixed inset-0 pointer-events-none z-5">
        <motion.div
          className="absolute top-[25%] left-0 w-full text-center text-[10vw] font-bold whitespace-nowrap opacity-[0.03] dark:opacity-[0.05]"
          animate={{ x: ["50vw", "-150vw"] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          CREATIVITY IS FREEDOM • ART IS LIFE • EXPRESS YOURSELF • IMAGINE
        </motion.div>
        <motion.div
          className="absolute top-[70%] left-0 w-full text-center text-[10vw] font-bold whitespace-nowrap opacity-[0.03] dark:opacity-[0.05]"
          animate={{ x: ["-150vw", "50vw"] }}
          transition={{
            duration: 45,
            repeat: Infinity,
            ease: "linear",
            delay: -20,
          }}
        >
          WELCOME TO THE STUDIO • CREATE • INSPIRE • BEYOND BOUNDARIES
        </motion.div>
      </div>
    </div>
  );
};

export default ArtLandingPage;
