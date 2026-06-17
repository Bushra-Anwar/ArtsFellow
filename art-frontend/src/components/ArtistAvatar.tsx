import React from "react";

interface ArtistAvatarProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackText?: string;
}

const ArtistAvatar: React.FC<ArtistAvatarProps> = ({
  src,
  alt,
  className,
  fallbackText,
}) => {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 100 115"
        className="w-full h-full drop-shadow-md pointer-events-none"
      >
        <defs>
          <clipPath id="dripClip">
            <path d="M50 0 C 85 0 100 25 100 50 C 100 75 92 80 88 90 C 85 98 80 98 77 90 C 75 82 70 82 68 90 C 62 115 50 115 45 90 C 43 82 38 82 35 90 C 32 98 25 98 22 90 C 18 80 10 75 0 50 C 0 25 15 0 50 0 Z" />
          </clipPath>
          <linearGradient id="dripGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>
        {/* Background for fallback */}
        {!src && (
          <path
            d="M50 0 C 85 0 100 25 100 50 C 100 75 92 80 88 90 C 85 98 80 98 77 90 C 75 82 70 82 68 90 C 62 115 50 115 45 90 C 43 82 38 82 35 90 C 32 98 25 98 22 90 C 18 80 10 75 0 50 C 0 25 15 0 50 0 Z"
            fill="white"
          />
        )}

        {/* Image */}
        {src && (
          <image
            href={src}
            width="100"
            height="115"
            clipPath="url(#dripClip)"
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Border */}
        <path
          d="M50 0 C 85 0 100 25 100 50 C 100 75 92 80 88 90 C 85 98 80 98 77 90 C 75 82 70 82 68 90 C 62 115 50 115 45 90 C 43 82 38 82 35 90 C 32 98 25 98 22 90 C 18 80 10 75 0 50 C 0 25 15 0 50 0 Z"
          fill="none"
          stroke="url(#dripGradient)"
          strokeWidth="3"
        />

        {/* Text Fallback (Overlay) */}
        {!src && (
          <text
            x="50"
            y="60"
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="40"
            fontWeight="bold"
            fill="url(#dripGradient)"
          >
            {fallbackText || alt?.charAt(0).toUpperCase()}
          </text>
        )}
      </svg>
    </div>
  );
};

export default ArtistAvatar;
