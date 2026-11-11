import React from 'react';
import { MapPin, Navigation, Car, ExternalLink, Battery, Compass } from 'lucide-react';

/**
 * LazyCommandCenterMap: Heavy Map/GPS Visualization Component
 * Designed to be lazy-loaded with React.Suspense so the initial dashboard render never blocks.
 */
export default function LazyCommandCenterMap({
  location,
  onCoordinateRide,
  parentName = 'Parent'
}) {
  const lat = location?.latitude || 12.9716;
  const lng = location?.longitude || 77.5946;
  const address = location?.address || 'Current Location, Bangalore';
  const battery = location?.battery_level || 82;

  return (
    <div className="relative w-full h-full min-h-[300px] bg-slate-950 overflow-hidden">
      {/* Mock Radar Grid Map Canvas */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:20px_20px] opacity-70" />
      
      {/* Dynamic Map Embed / OpenStreetMap Leaflet View */}
      <iframe
        title="Live Elder Location"
        className="w-full h-full border-0 filter invert contrast-125 hue-rotate-180 brightness-95 opacity-85"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lng}`}
      />

      {/* Floating Center Radar Pulse on Elder Pin */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <span className="absolute h-16 w-16 animate-ping rounded-full bg-emerald-500/40" />
        <span className="absolute h-8 w-8 animate-pulse rounded-full bg-emerald-400/60" />
        <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl ring-2 ring-emerald-300">
          <MapPin size={22} className="animate-bounce" />
        </div>
      </div>

      {/* Top Map HUD Overlay */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 shadow-lg">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-mono font-semibold text-emerald-300 uppercase tracking-wide">
            Live GPS Tracking
          </span>
        </div>

        <div className="flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60 px-3 py-1.5 shadow-lg text-slate-200">
          <Battery size={14} className={battery < 20 ? 'text-red-400' : 'text-emerald-400'} />
          <span className="text-xs font-mono font-bold">{battery}%</span>
        </div>
      </div>

      {/* Bottom Map Quick Action Bar */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-auto">
        <div className="flex-1 truncate rounded-xl bg-slate-900/95 backdrop-blur-md border border-slate-700/80 px-3 py-2 text-white shadow-xl">
          <div className="text-[10px] uppercase font-bold text-slate-400">Current Position</div>
          <div className="text-xs font-semibold truncate text-slate-100">{address}</div>
        </div>

        <div className="flex items-center gap-1.5">
          {onCoordinateRide && (
            <button
              onClick={onCoordinateRide}
              className="flex items-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-3 py-2 text-xs font-bold text-white shadow-lg transition-transform active:scale-95"
            >
              <Car size={14} />
              <span>Ride</span>
            </button>
          )}

          <a
            href={`https://maps.google.com/?q=${lat},${lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-2 text-xs font-bold text-white shadow-lg"
          >
            <ExternalLink size={14} />
            <span>Maps</span>
          </a>
        </div>
      </div>
    </div>
  );
}

