import { ScanLine, Target, X } from 'lucide-react';
import type { Drone, Detection } from '../types';

interface DetectionPanelProps {
  drone: Drone;
}

const THREAT_CONFIG: Record<Detection['threat'], { color: string; bg: string; border: string; label: string }> = {
  low: { color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-600/30', label: 'LOW' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30', label: 'MED' },
  high: { color: 'text-danger-400', bg: 'bg-danger-600/10', border: 'border-danger-600/30', label: 'HIGH' },
  critical: { color: 'text-danger-500', bg: 'bg-danger-700/20', border: 'border-danger-600/50', label: 'CRIT' },
};

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 1) return 'now';
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

export default function DetectionPanel({ drone }: DetectionPanelProps) {
  const detections = [...drone.detections].sort((a, b) => b.confidence - a.confidence);

  return (
    <div className="flex flex-col bg-ink-900 border border-ink-700/50 clip-corner overflow-hidden h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-700/40 bg-ink-850/50">
        <div className="flex items-center gap-2">
          <ScanLine className="w-4 h-4 text-aegis-400" />
          <span className="font-display font-semibold text-xs tracking-[0.2em] text-ink-200 uppercase">
            AI Detections
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-ink-400">YOLOv8</span>
          <span className="px-1.5 py-0.5 bg-aegis-900/40 border border-aegis-700/40 font-mono text-[9px] text-aegis-400 tracking-wider clip-corner-sm">
            ACTIVE
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {detections.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <Target className="w-8 h-8 text-ink-600 mb-2" />
            <p className="font-mono text-xs text-ink-500 tracking-wider">NO OBJECTS DETECTED</p>
            <p className="font-mono text-[10px] text-ink-600 mt-1">Scanning feed...</p>
          </div>
        )}

        {detections.map((det) => {
          const c = THREAT_CONFIG[det.threat];
          return (
            <div
              key={det.id}
              className={`relative flex items-center gap-2 p-2 ${c.bg} border ${c.border} clip-corner-sm animate-fade-in`}
            >
              {/* Threat indicator */}
              <div className="flex flex-col items-center gap-0.5">
                <span className={`w-1.5 h-1.5 rounded-full ${c.color.replace('text-', 'bg-')} ${det.threat === 'critical' ? 'animate-blink' : ''}`} />
                <span className={`font-mono text-[8px] ${c.color} font-medium`}>{c.label}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-medium text-ink-100 capitalize">{det.label}</span>
                  <span className={`font-mono text-sm font-medium tabular-nums ${c.color}`}>
                    {(det.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                {/* Confidence bar */}
                <div className="mt-1 h-0.5 bg-ink-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${c.color.replace('text-', 'bg-')} transition-all duration-500`}
                    style={{ width: `${det.confidence * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-mono text-[9px] text-ink-500">
                    POS {det.x.toFixed(0)},{det.y.toFixed(0)}
                  </span>
                  <span className="font-mono text-[9px] text-ink-500">{timeAgo(det.timestamp)} ago</span>
                </div>
              </div>

              {/* Action */}
              <button className="flex items-center justify-center w-6 h-6 text-ink-500 hover:text-danger-400 hover:bg-danger-700/20 transition-colors clip-corner-sm flex-shrink-0">
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-ink-700/40 bg-ink-850/50">
        <span className="font-mono text-[10px] text-ink-400">
          {detections.length} active {detections.length === 1 ? 'track' : 'tracks'}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-ink-400">
            THREATS: <span className="text-danger-400">{detections.filter((d) => d.threat === 'critical' || d.threat === 'high').length}</span>
          </span>
          <span className="font-mono text-[10px] text-ink-400">
            AVG: <span className="text-aegis-400">{detections.length > 0 ? (detections.reduce((s, d) => s + d.confidence, 0) / detections.length * 100).toFixed(0) : 0}%</span>
          </span>
        </div>
      </div>
    </div>
  );
}
