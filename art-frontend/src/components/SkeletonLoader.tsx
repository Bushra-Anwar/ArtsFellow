import React, { memo } from "react";

/**
 * Reusable skeleton loader components for instant perceived loading.
 * Uses pure CSS animations for zero JS overhead.
 */

export const SkeletonCard: React.FC<{ className?: string }> = memo(({ className = "" }) => (
  <div className={`rounded-2xl overflow-hidden ${className}`}>
    <div className="skeleton aspect-square w-full" />
    <div className="p-4 space-y-3">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-10 w-full mt-3" />
    </div>
  </div>
));
SkeletonCard.displayName = "SkeletonCard";

export const SkeletonGrid: React.FC<{ count?: number }> = memo(({ count = 8 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
));
SkeletonGrid.displayName = "SkeletonGrid";

export const SkeletonLine: React.FC<{ width?: string; height?: string }> = memo(({ 
  width = "100%", 
  height = "16px" 
}) => (
  <div className="skeleton" style={{ width, height }} />
));
SkeletonLine.displayName = "SkeletonLine";

export const SkeletonAvatar: React.FC<{ size?: number }> = memo(({ size = 48 }) => (
  <div
    className="skeleton rounded-full"
    style={{ width: size, height: size }}
  />
));
SkeletonAvatar.displayName = "SkeletonAvatar";

export const SkeletonProfile: React.FC = memo(() => (
  <div className="flex items-center gap-4 p-4">
    <SkeletonAvatar size={56} />
    <div className="flex-1 space-y-2">
      <SkeletonLine width="60%" height="20px" />
      <SkeletonLine width="40%" height="14px" />
    </div>
  </div>
));
SkeletonProfile.displayName = "SkeletonProfile";

export default { SkeletonCard, SkeletonGrid, SkeletonLine, SkeletonAvatar, SkeletonProfile };
