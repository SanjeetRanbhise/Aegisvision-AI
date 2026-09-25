import { useEffect, useRef, useState } from 'react';
import { Video, Maximize2, Crosshair, Camera, Radio } from 'lucide-react';
import type { Drone, Detection } from '../types';

interface VideoFeedProps {
  drone: Drone;
}

const THREAT_COLORS: Record<Detection['threat'], { box: string; label: string; text: string; glow: string }> = {
  low: { box: 'border-cyan-400/70', label: 'bg-cyan-500/85', text: 'text-cyan-50', glow: 'shadow-glow-cyan' },
  medium: { box: 'border-amber-400/80', label: 'bg-amber-500/85', text: 'text-amber-50', glow: 'shadow-glow-amber' },
  high: { box: 'border-danger-400/80', label: 'bg-danger-600/85', text: 'text-danger-50', glow: 'shadow-glow-danger' },
  critical: { box: 'border-danger-500', label: 'bg-danger-600', text: 'text-white', glow: 'shadow-glow-danger' },
};

export default function VideoFeed({ drone }: VideoFeedProps) {
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setFeedLoaded(false);
  }, [drone.id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setScanProgress((p) => (p + 1.5) % 100);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const isOffline = drone.status === 'offline';

  return (
    <div className="relative flex flex-col bg-ink-950 border border-ink-700/50 clip-corner overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-ink-900/80 border-b border-ink-700/40 backdrop-blur-sm z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-ink-500' : 'bg-danger-500 animate-blink'} shadow-glow-danger`} />
            <span className="font-mono text-[10px] tracking-widest text-danger-400 uppercase">
              {isOffline ? 'FEED LOST' : 'LIVE'}
            </span>
          </div>
          <Video className="w-4 h-4 text-ink-400" />
          <span className="font-mono text-sm font-medium text-ink-100">{drone.callsign}</span>
          <span className="font-mono text-[10px] text-ink-400 hidden sm:inline">/ {drone.zone}</span>
        </div>
        <div className="flex items-center gap-1">
          <FeedButton icon={<Crosshair className="w-3.5 h-3.5" />} />
          <FeedButton icon={<Camera className="w-3.5 h-3.5" />} />
          <FeedButton icon={<Radio className="w-3.5 h-3.5" />} />
          <FeedButton icon={<Maximize2 className="w-3.5 h-3.5" />} />
        </div>
      </div>

      {/* Video area */}
      <div className="relative flex-1 overflow-hidden bg-black scanlines">
        {/* Feed image */}
        {!isOffline && (
          <img
            ref={imgRef}
            src={drone.feedUrl}
            alt={`${drone.callsign} feed`}
            onLoad={() => setFeedLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${feedLoaded ? 'opacity-60' : 'opacity-0'}`}
          />
        )}

        {/* Dark overlay for HUD contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50" />

        {/* Loading state */}
        {!feedLoaded && !isOffline && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-aegis-600/30 border-t-aegis-400 rounded-full animate-spin" />
              <span className="font-mono text-xs text-ink-400 tracking-widest">ACQUIRING FEED...</span>
            </div>
          </div>
        )}

        {/* Offline state */}
        {isOffline && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950">
            <div className="text-center">
              <Video className="w-12 h-12 text-ink-600 mx-auto mb-3" />
              <p className="font-mono text-sm text-ink-500 tracking-widest">SIGNAL LOST</p>
              <p className="font-mono text-[10px] text-ink-600 mt-1">ATTEMPTING RECONNECT...</p>
            </div>
          </div>
        )}

        {/* Detection boxes */}
        {feedLoaded && !isOffline && drone.detections.map((det) => {
          const c = THREAT_COLORS[det.threat];
          return (
            <div
              key={det.id}
              className={`absolute border-2 ${c.box} ${c.glow} transition-all duration-300 animate-fade-in`}
              style={{
                left: `${det.x}%`,
                top: `${det.y}%`,
                width: `${det.w}%`,
                height: `${det.h}%`,
              }}
            >
              {/* Corner accents */}
              <span className={`absolute -top-px -left-px w-2 h-2 border-t-2 border-l-2 ${c.box}`} />
              <span className={`absolute -top-px -right-px w-2 h-2 border-t-2 border-r-2 ${c.box}`} />
              <span className={`absolute -bottom-px -left-px w-2 h-2 border-b-2 border-l-2 ${c.box}`} />
              <span className={`absolute -bottom-px -right-px w-2 h-2 border-b-2 border-r-2 ${c.box}`} />

              {/* Label */}
              <div className={`absolute -top-5 left-0 px-1.5 py-0.5 ${c.label} ${c.text} font-mono text-[9px] font-medium tracking-wide whitespace-nowrap clip-corner-sm`}>
                {det.label.toUpperCase()} · {(det.confidence * 100).toFixed(0)}%
              </div>

              {/* Critical pulse */}
              {det.threat === 'critical' && (
                <div className={`absolute inset-0 border-2 border-danger-400 animate-pulse-ring`} />
              )}
            </div>
          );
        })}

        {/* HUD overlay */}
        {feedLoaded && !isOffline && (
          <>
            {/* Crosshair */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-32 h-32">
                <div className="absolute top-1/2 left-0 w-full h-px bg-aegis-400/20" />
                <div className="absolute left-1/2 top-0 w-px h-full bg-aegis-400/20" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-aegis-400/40 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-aegis-400 rounded-full" />
              </div>
            </div>

            {/* Scan line */}
            <div
              className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-aegis-400/40 to-transparent pointer-events-none"
              style={{ top: `${scanProgress}%` }}
            />

            {/* Top HUD info */}
            <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none z-10">
              <HudLine label="ALT" value={`${Math.round(drone.altitude)}m`} />
              <HudLine label="SPD" value={`${Math.round(drone.speed)}kts`} />
              <HudLine label="HDG" value={`${Math.round(drone.heading).toString().padStart(3, '0')}°`} />
            </div>

            <div className="absolute top-3 right-3 flex flex-col gap-1 items-end pointer-events-none z-10">
              <HudLine label="LAT" value={drone.lat.toFixed(4)} right />
              <HudLine label="LON" value={drone.lng.toFixed(4)} right />
              <HudLine label="BAT" value={`${Math.round(drone.battery)}%`} right />
            </div>

            {/* Bottom HUD */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between pointer-events-none z-10">
              <div className="flex items-center gap-2 px-2 py-1 bg-black/50 backdrop-blur-sm border border-aegis-700/30 clip-corner-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-500 animate-blink" />
                <span className="font-mono text-[10px] text-ink-200 tracking-wider">REC</span>
                <span className="font-mono text-[10px] text-ink-400 tabular-nums">{new Date().toTimeString().slice(0, 8)}</span>
              </div>
              <div className="px-2 py-1 bg-black/50 backdrop-blur-sm border border-aegis-700/30 clip-corner-sm">
                <span className="font-mono text-[10px] text-aegis-400 tracking-wider">
                  {drone.detections.length} OBJECTS TRACKED
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function FeedButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="flex items-center justify-center w-7 h-7 text-ink-400 hover:text-aegis-400 hover:bg-ink-800 border border-transparent hover:border-aegis-700/40 transition-colors clip-corner-sm">
      {icon}
    </button>
  );
}

function HudLine({ label, value, right }: { label: string; value: string; right?: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 ${right ? 'flex-row-reverse' : ''}`}>
      <span className="font-mono text-[9px] text-aegis-400/70 tracking-widest">{label}</span>
      <span className="font-mono text-[10px] text-ink-100 tabular-nums">{value}</span>
    </div>
  );
}
