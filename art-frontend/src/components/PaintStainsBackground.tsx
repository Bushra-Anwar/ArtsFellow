import React, { memo } from "react";

/**
 * Pure CSS ambient background replacing Framer Motion infinite animations.
 * Uses CSS keyframes on GPU-composited properties only (transform, opacity).
 */
const PaintStainsBackground: React.FC<{
  opacity?: number;
  interactive?: boolean;
}> = memo(({ opacity = 0.5 }) => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden mix-blend-multiply dark:mix-blend-screen"
      style={{ opacity }}
    >
      <div
        className="absolute top-[10%] left-[5%] w-64 h-64 md:w-96 md:h-96 rounded-full bg-[var(--color-primary)]/20 blur-[100px] animate-stain-1"
        style={{ willChange: "transform, opacity" }}
      />
      <div
        className="absolute bottom-[20%] right-[10%] w-72 h-72 md:w-[30rem] md:h-[30rem] rounded-full bg-cyan-500/10 blur-[120px] animate-stain-2"
        style={{ willChange: "transform, opacity" }}
      />
      <div
        className="absolute top-[40%] left-[40%] w-56 h-56 md:w-80 md:h-80 rounded-full bg-emerald-500/10 blur-[90px] animate-stain-3"
        style={{ willChange: "transform, opacity" }}
      />
      <div
        className="absolute bottom-[5%] left-[15%] w-48 h-48 md:w-72 md:h-72 rounded-full bg-teal-600/15 blur-[100px] animate-stain-4"
        style={{ willChange: "transform, opacity" }}
      />
    </div>
  );
});

PaintStainsBackground.displayName = "PaintStainsBackground";

export default PaintStainsBackground;
