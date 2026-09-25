import { Plane, Battery, Signal, ChevronRight } from 'lucide-react';
import type { Drone } from '../types';

interface SidebarProps {
  drones: Drone[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const STATUS_CONFIG: Record<Drone['status'], { label: string; color: string; dot: string }> = {
  active: { label: 'ACTIVE', color: 'text-aegis-400', dot: 'bg-aegis-400 shadow-glow-green' },
  standby: { label: 'STANDBY', color: 'text-amber-400', dot: 'bg-amber-400 shadow-glow-amber' },
  returning: { label: 'RTB', color: 'text-cyan-400', dot: 'bg-cyan-400 shadow-glow-cyan' },
  offline: { label: 'OFFLINE', color: 'text-ink-400', dot: 'bg-ink-500' },
};

export default function Sidebar({ drones, selectedId, onSelect }: SidebarProps) {
  return (
    <aside className="flex flex-col w-56 bg-ink-900 border-r border-ink-700/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-700/40">
        <span className="font-display font-semibold text-xs tracking-[0.2em] text-ink-200 uppercase">
          Fleet
        </span>
        <span className="font-mono text-[10px] text-ink-400 tabular-nums">
          {drones.filter((d) => d.status !== 'offline').length}/{drones.length} ONLINE
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {drones.map((drone) => {
          const cfg = STATUS_CONFIG[drone.status];
          const isSelected = drone.id === selectedId;
          const isOffline = drone.status === 'offline';
          return (
            <button
              key={drone.id}
              onClick={() => onSelect(drone.id)}
              disabled={isOffline}
              className={`relative w-full flex flex-col gap-1.5 px-3 py-2.5 text-left transition-all group ${
                isSelected
                  ? 'bg-aegis-900/30 border-l-2 border-aegis-400'
                  : 'border-l-2 border-transparent hover:bg-ink-850'
              } ${isOffline ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isSelected && (
                <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-aegis-400" />
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Plane className={`w-3.5 h-3.5 ${isSelected ? 'text-aegis-400' : 'text-ink-400'}`} strokeWidth={2.2} />
                  <span className={`font-mono text-sm font-medium ${isSelected ? 'text-ink-100' : 'text-ink-200'}`}>
                    {drone.callsign}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot} ${drone.status === 'active' ? 'animate-blink' : ''}`} />
                </div>
              </div>

              <div className="flex items-center justify-between pl-5">
                <span className={`font-mono text-[10px] tracking-wider ${cfg.color}`}>{cfg.label}</span>
                <span className="font-mono text-[10px] text-ink-400">{drone.zone}</span>
              </div>

              {!isOffline && (
                <div className="flex items-center gap-3 pl-5 mt-0.5">
                  <div className="flex items-center gap-1">
                    <Battery className={`w-3 h-3 ${drone.battery < 25 ? 'text-danger-400' : 'text-ink-400'}`} />
                    <span className={`font-mono text-[10px] tabular-nums ${drone.battery < 25 ? 'text-danger-400' : 'text-ink-300'}`}>
                      {Math.round(drone.battery)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Signal className="w-3 h-3 text-ink-400" />
                    <span className="font-mono text-[10px] tabular-nums text-ink-300">{Math.round(drone.signal)}%</span>
                  </div>
                  {drone.detections.length > 0 && (
                    <span className="font-mono text-[10px] tabular-nums text-amber-400 ml-auto">
                      {drone.detections.length} DET
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-4 py-3 border-t border-ink-700/40 bg-ink-950/50">
        <div className="font-mono text-[10px] text-ink-500 tracking-widest uppercase mb-1">Mission Status</div>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-aegis-400 animate-blink" />
          <span className="font-mono text-xs text-aegis-400">SURVEILLANCE ACTIVE</span>
        </div>
      </div>
    </aside>
  );
}
