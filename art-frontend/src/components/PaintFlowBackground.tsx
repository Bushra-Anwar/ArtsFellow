import React, { memo } from "react";

interface PaintFlowBackgroundProps {
  color?: string;
  opacity?: number;
}

/**
 * Ultra-lightweight ambient background using CSS-only animations.
 * Zero canvas, zero requestAnimationFrame, zero JS computation.
 * All animations run on the GPU compositor thread via CSS transforms.
 */
const PaintFlowBackground: React.FC<PaintFlowBackgroundProps> = memo(({
  opacity = 0.1,
}) => {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden"
      style={{ opacity }}
    >
      {/* Ambient orb 1 - Teal */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full animate-ambient-1"
        style={{
          background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)",
          top: "10%",
          left: "15%",
          filter: "blur(120px)",
          willChange: "transform",
        }}
      />

      {/* Ambient orb 2 - White */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full animate-ambient-2"
        style={{
          background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)",
          top: "50%",
          right: "10%",
          filter: "blur(100px)",
          willChange: "transform",
        }}
      />

      {/* Ambient orb 3 - Teal bottom flow */}
      <div
        className="absolute w-[800px] h-[400px] rounded-full animate-ambient-3"
        style={{
          background: "radial-gradient(ellipse, var(--color-primary) 0%, transparent 70%)",
          bottom: "-10%",
          left: "30%",
          filter: "blur(140px)",
          willChange: "transform",
        }}
      />
    </div>
  );
});

PaintFlowBackground.displayName = "PaintFlowBackground";

export default PaintFlowBackground;
