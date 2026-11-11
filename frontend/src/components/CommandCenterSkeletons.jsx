import React from 'react';

/**
 * Shimmering Tailwind Skeleton Loaders
 * Prevents UI layout shift and provides instantaneous visual feedback
 * during asynchronous fetching of the pre-aggregated summary and map assets.
 */

export function MapSkeletonLoader() {
  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-900 animate-pulse flex flex-col justify-between p-4">
      {/* Top HUD Skeleton */}
      <div className="flex justify-between items-center w-full">
        <div className="h-6 w-32 bg-slate-800 rounded-lg" />
        <div className="h-6 w-16 bg-slate-800 rounded-lg" />
      </div>

      {/* Center Radar Pulsing Target */}
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="h-12 w-12 rounded-full bg-slate-800 border-2 border-slate-700 animate-ping opacity-50" />
        <div className="h-4 w-40 bg-slate-800 rounded" />
      </div>

      {/* Bottom Action Bar Skeleton */}
      <div className="flex gap-2 w-full">
        <div className="h-10 flex-1 bg-slate-800 rounded-xl" />
        <div className="h-10 w-20 bg-slate-800 rounded-xl" />
        <div className="h-10 w-16 bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
}

export function VitalsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 animate-pulse">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl bg-slate-800/60 border border-slate-700/40 p-4 space-y-3">
          <div className="flex justify-between items-center">
            <div className="h-3 w-16 bg-slate-700 rounded" />
            <div className="h-5 w-5 bg-slate-700 rounded-full" />
          </div>
          <div className="h-7 w-24 bg-slate-700 rounded" />
          <div className="h-3 w-20 bg-slate-700/60 rounded" />
        </div>
      ))}
    </div>
  );
}

export function RideBannerSkeleton() {
  return (
    <div className="rounded-2xl bg-slate-800/60 border border-slate-700/40 p-4 space-y-2 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 w-28 bg-slate-700 rounded" />
        <div className="h-4 w-16 bg-slate-700 rounded-full" />
      </div>
      <div className="h-3 w-48 bg-slate-700/60 rounded" />
    </div>
  );
}

