import React, { useRef } from "react";

interface MagnetProps {
  children: React.ReactNode;
  strength?: number;
}

/**
 * Cursor Magnet — wraps any element with a subtle "pull" toward the mouse.
 */
export default function Magnet({ children, strength = 0.2 }: MagnetProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };

  const reset = () => {
    if (!ref.current) return;
    ref.current.style.transform = `translate(0px, 0px)`;
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={{ transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)", display: "inline-block" }}
    >
      {children}
    </div>
  );
}
