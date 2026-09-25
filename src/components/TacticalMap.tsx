import { useEffect, useState } from 'react';
import { Map as MapIcon, Crosshair, Layers, Radar } from 'lucide-react';
import type { Drone, GeofenceZone } from '../types';

interface TacticalMapProps {
  drones: Drone[];
  selectedId: string;
  onSelect: (id: string) => void;
  geofences: GeofenceZone[];
}

const STATUS_POS: Record<Drone['status'], { fill: string; stroke: string; label: string }> = {
  active: { fill: '#12d667', stroke: '#34ed84', label: 'text-aegis-400' },
  standby: { fill: '#ff9d1c', stroke: '#ffb547', label: 'text-amber-400' },
  returning: { fill: '#06b6d4', stroke: '#22d3ee', label: 'text-cyan-400' },
  offline: { fill: '#324659', stroke: '#4a6378', label: 'text-ink-400' },
};

const GEOFENCE_COLORS: Record<GeofenceZone['status'], { stroke: string; fill: string; label: string }> = {
  secure: { stroke: '#12d667', fill: 'rgba(18,214,103,0.06)', label: 'text-aegis-400' },
  warning: { stroke: '#ff9d1c', fill: 'rgba(255,157,28,0.08)', label: 'text-amber-400' },
  breach: { stroke: '#ef3a4d', fill: 'rgba(239,58,77,0.1)', label: 'text-danger-400' },
};

export default function TacticalMap({ drones, selectedId, onSelect, geofences }: TacticalMapProps) {
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle((a) => (a + 2) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Map drone lat/lng to SVG coordinates (normalize around base position)
  const projectDrone = (d: Drone) => {
    const baseLat = 34.0522;
    const baseLng = -118.2437;
    const x = ((d.lng - baseLng + 0.1) / 0.2) * 100;
    const y = ((baseLat - d.lat + 0.1) / 0.2) * 100;
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  return (
    <div className="relative flex flex-col bg-ink-950 border border-ink-700/50 clip-corner overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-ink-900/80 border-b border-ink-700/40 backdrop-blur-sm z-20">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-display font-semibold text-xs tracking-[0.2em] text-ink-200 uppercase">
            Tactical Map
          </span>
        </div>
        <div className="flex items-center gap-1">
          <FeedButton icon={<Layers className="w-3.5 h-3.5" />} />
          <FeedButton icon={<Crosshair className="w-3.5 h-3.5" />} />
        </div>
      </div>

      {/* Map area */}
      <div className="relative flex-1 overflow-hidden tac-grid bg-ink-950">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          {/* Concentric range rings */}
          {[15, 30, 45].map((r) => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(50,70,89,0.15)" strokeWidth="0.2" strokeDasharray="1 1" />
          ))}
          <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(50,70,89,0.12)" strokeWidth="0.15" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(50,70,89,0.12)" strokeWidth="0.15" />

          {/* Radar sweep */}
          <defs>
            <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(18,214,103,0)" />
              <stop offset="100%" stopColor="rgba(18,214,103,0.15)" />
            </linearGradient>
          </defs>
          <g transform={`translate(50 50) rotate(${sweepAngle})`}>
            <path d="M 0 0 L 45 0 A 45 45 0 0 0 38.97 -22.5 Z" fill="url(#sweepGrad)" />
          </g>

          {/* Geofence zones */}
          {geofences.map((gf) => {
            const c = GEOFENCE_COLORS[gf.status];
            return (
              <g key={gf.id}>
                <circle
                  cx={gf.cx}
                  cy={gf.cy}
                  r={gf.r}
                  fill={c.fill}
                  stroke={c.stroke}
                  strokeWidth="0.3"
                  strokeDasharray="1.5 0.8"
                  className={gf.status === 'breach' ? 'animate-blink' : ''}
                />
                <text
                  x={gf.cx}
                  y={gf.cy - gf.r - 1.5}
                  textAnchor="middle"
                  fill={c.stroke}
                  fontSize="2.2"
                  fontFamily="JetBrains Mono"
                  fontWeight="500"
                >
                  {gf.name}
                </text>
                {gf.status === 'breach' && (
                  <circle cx={gf.cx} cy={gf.cy} r={gf.r} fill="none" stroke={c.stroke} strokeWidth="0.5" className="animate-pulse-ring" />
                )}
              </g>
            );
          })}

          {/* Drone-to-drone connection lines (active drones) */}
          {drones.filter((d) => d.status === 'active').map((d, i, arr) => {
            if (i === arr.length - 1) return null;
            const p1 = projectDrone(d);
            const p2 = projectDrone(arr[i + 1]);
            return (
              <line
                key={`link-${d.id}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="rgba(18,214,103,0.12)"
                strokeWidth="0.15"
                strokeDasharray="0.8 0.8"
              />
            );
          })}

          {/* Drones */}
          {drones.map((d) => {
            const pos = projectDrone(d);
            const cfg = STATUS_POS[d.status];
            const isSelected = d.id === selectedId;
            return (
              <g
                key={d.id}
                transform={`translate(${pos.x} ${pos.y})`}
                onClick={() => onSelect(d.id)}
                className="cursor-pointer"
              >
                {/* Selection ring */}
                {isSelected && (
                  <circle r="3.5" fill="none" stroke={cfg.stroke} strokeWidth="0.3" className="animate-blink" />
                )}
                {/* Active pulse */}
                {d.status === 'active' && (
                  <circle r="2" fill="none" stroke={cfg.stroke} strokeWidth="0.2" className="animate-pulse-ring" style={{ transformOrigin: 'center' }} />
                )}
                {/* Drone marker */}
                <circle r="1.2" fill={cfg.fill} stroke={cfg.stroke} strokeWidth="0.3" />
                {/* Heading indicator */}
                {d.status !== 'offline' && (
                  <line
                    x1="0"
                    y1="0"
                    x2={Math.cos((d.heading - 90) * Math.PI / 180) * 2.5}
                    y2={Math.sin((d.heading - 90) * Math.PI / 180) * 2.5}
                    stroke={cfg.stroke}
                    strokeWidth="0.25"
                  />
                )}
                {/* Label */}
                <text
                  x="2.5"
                  y="0.8"
                  fill={cfg.stroke}
                  fontSize="1.8"
                  fontFamily="JetBrains Mono"
                  fontWeight="500"
                  opacity="0.85"
                >
                  {d.callsign}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Map overlay info */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2 py-1 bg-black/60 backdrop-blur-sm border border-ink-700/40 clip-corner-sm z-10">
          <Radar className="w-3 h-3 text-aegis-400 animate-blink" />
          <span className="font-mono text-[10px] text-ink-300 tracking-wider">RADAR SWEEP ACTIVE</span>
        </div>

        <div className="absolute bottom-3 right-3 flex flex-col gap-1 px-2 py-1.5 bg-black/60 backdrop-blur-sm border border-ink-700/40 clip-corner-sm z-10">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-aegis-400" />
            <span className="font-mono text-[9px] text-ink-300">ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="font-mono text-[9px] text-ink-300">STANDBY</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span className="font-mono text-[9px] text-ink-300">RTB</span>
          </div>
        </div>

        {/* Compass */}
        <div className="absolute top-3 right-3 z-10">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border border-ink-600/40 rounded-full" />
            <span className="absolute top-0.5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-aegis-400">N</span>
            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 font-mono text-[8px] text-ink-500">S</span>
            <span className="absolute left-0.5 top-1/2 -translate-y-1/2 font-mono text-[8px] text-ink-500">W</span>
            <span className="absolute right-0.5 top-1/2 -translate-y-1/2 font-mono text-[8px] text-ink-500">E</span>
            <div className="absolute top-1/2 left-1/2 w-px h-4 bg-aegis-400/60 -translate-x-1/2 -translate-y-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedButton({ icon }: { icon: React.ReactNode }) {
  return (
    <button className="flex items-center justify-center w-7 h-7 text-ink-400 hover:text-cyan-400 hover:bg-ink-800 border border-transparent hover:border-cyan-600/30 transition-colors clip-corner-sm">
      {icon}
    </button>
  );
}
