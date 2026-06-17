import React from "react";
import { motion } from "framer-motion";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({
  className = "h-12 w-auto",
  showText = true,
}) => {
  // Animation variants - Cast to any to prevent strict TypeScript 'Variants' mismatch errors
  const itemAnim: any = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: i * 0.1,
        type: "spring",
        stiffness: 200,
        damping: 10,
      },
    }),
  };

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <motion.svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-auto aspect-square drop-shadow-sm"
        initial="hidden"
        animate="visible"
      >
        <defs>
          <linearGradient id="brushGrad" x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="var(--primary)" />{" "}
            {/* Dynamic Primary */}
            <stop offset="100%" stopColor="var(--secondary)" />{" "}
            {/* Dynamic Secondary */}
          </linearGradient>
        </defs>

        {/* 1. Abstract Splash/Background - Subtle Brand Color */}
        <motion.path
          d="M 50 10 C 20 10, 5 35, 10 65 C 15 90, 40 95, 60 90 C 80 85, 95 65, 90 40 C 85 20, 70 10, 50 10 Z"
          fill="url(#brushGrad)"
          className="opacity-10"
          custom={0}
          variants={itemAnim}
        />

        {/* 2. The Palette Shape */}
        <motion.path
          d="M 20 50 C 20 25, 45 15, 65 20 C 85 25, 85 55, 65 75 C 45 95, 20 85, 20 50 Z"
          fill="url(#brushGrad)"
          fillOpacity="0.12"
          stroke="var(--primary)"
          strokeWidth="3"
          custom={1}
          variants={itemAnim}
        />

        {/* 3. Paint Blobs - Vibrant Palette */}
        <motion.circle
          cx="35"
          cy="40"
          r="4.5"
          fill="#FF5252"
          custom={2}
          variants={itemAnim}
        />
        <motion.circle
          cx="50"
          cy="35"
          r="4.5"
          fill="#4CAF50"
          custom={3}
          variants={itemAnim}
        />
        <motion.circle
          cx="55"
          cy="55"
          r="4.5"
          fill="#FFC107"
          custom={4}
          variants={itemAnim}
        />

        {/* Thumb Hole */}
        <motion.circle
          cx="35"
          cy="65"
          r="7"
          fill="var(--primary)"
          fillOpacity="0.15"
          stroke="var(--primary)"
          strokeWidth="2"
          custom={5}
          variants={itemAnim}
        />

        {/* 4. Brush Icon - Refined Handle & Tip */}
        <motion.path
          d="M 45 80 L 85 25"
          stroke="#1f2937"
          strokeWidth="7"
          strokeLinecap="round"
          custom={6}
          variants={itemAnim}
        />
        <motion.path
          d="M 85 25 L 92 15"
          stroke="var(--primary)"
          strokeWidth="9"
          strokeLinecap="round"
          custom={7}
          variants={itemAnim}
        />
      </motion.svg>

      {/* 5. Typography - 'ARTsFellow' Branding */}
      {showText && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-baseline"
          style={{ fontFamily: '"Outfit", sans-serif' }}
        >
          <span className="text-2xl font-black tracking-tight flex items-baseline">
            <span style={{ color: "var(--color-primary)" }}>AR</span>
            <span style={{ color: "#FF5252" }}>T</span>
            <span style={{ color: "#FFC107" }} className="text-xl">
              s
            </span>
            <span className="text-slate-800 dark:text-[var(--text-main)]">
              Fellow
            </span>
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default Logo;
