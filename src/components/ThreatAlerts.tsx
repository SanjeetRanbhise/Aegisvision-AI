import { AlertTriangle, ShieldAlert, CheckCircle2, MapPin, Clock } from 'lucide-react';
import type { ThreatAlert } from '../types';

interface ThreatAlertsProps {
  alerts: ThreatAlert[];
  onAcknowledge: (id: string) => void;
}

const LEVEL_CONFIG: Record<ThreatAlert['level'], { color: string; bg: string; border: string; glow: string; icon: string }> = {
  low: { color: 'text-cyan-400', bg: 'bg-cyan-500/5', border: 'border-cyan-600/20', glow: '', icon: 'text-cyan-400' },
  medium: { color: 'text-amber-400', bg: 'bg-amber-500/5', border: 'border-amber-500/25', glow: 'shadow-glow-amber', icon: 'text-amber-400' },
  high: { color: 'text-danger-400', bg: 'bg-danger-600/8', border: 'border-danger-600/30', glow: 'shadow-glow-danger', icon: 'text-danger-400' },
  critical: { color: 'text-danger-500', bg: 'bg-danger-700/12', border: 'border-danger-600/50', glow: 'shadow-glow-danger', icon: 'text-danger-500' },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export default function ThreatAlerts({ alerts, onAcknowledge }: ThreatAlertsProps) {
  const sorted = [...alerts].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    const levelDiff = order[a.level] - order[b.level];
    if (levelDiff !== 0) return levelDiff;
    return b.timestamp - a.timestamp;
  });

  return (
    <div className="flex flex-col bg-ink-900 border border-ink-700/50 clip-corner overflow-hidden h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-700/40 bg-ink-850/50">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-danger-400" />
          <span className="font-display font-semibold text-xs tracking-[0.2em] text-ink-200 uppercase">
            Threat Alerts
          </span>
        </div>
        <span className="font-mono text-[10px] text-ink-400 tabular-nums">
          {alerts.filter((a) => !a.acknowledged).length} PENDING
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {sorted.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-aegis-600 mb-2" />
            <p className="font-mono text-xs text-ink-500 tracking-wider">NO ACTIVE THREATS</p>
            <p className="font-mono text-[10px] text-ink-600 mt-1">All sectors secure</p>
          </div>
        )}

        {sorted.map((alert) => {
          const c = LEVEL_CONFIG[alert.level];
          return (
            <div
              key={alert.id}
              className={`relative ${c.bg} border ${c.border} ${alert.level === 'critical' && !alert.acknowledged ? c.glow : ''} clip-corner-sm ${alert.acknowledged ? 'opacity-50' : 'animate-slide-in'}`}
            >
              <div className="flex items-start gap-2 p-2.5">
                {/* Icon */}
                <div className={`flex-shrink-0 ${alert.level === 'critical' && !alert.acknowledged ? 'animate-blink' : ''}`}>
                  <AlertTriangle className={`w-4 h-4 ${c.icon}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-mono text-[9px] font-bold tracking-widest ${c.color}`}>
                      {alert.level.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-ink-500" />
                      <span className="font-mono text-[9px] text-ink-500 tabular-nums">{formatTime(alert.timestamp)}</span>
                    </div>
                  </div>
                  <p className="font-display font-semibold text-sm text-ink-100 mt-0.5 leading-tight">
                    {alert.title}
                  </p>
                  <p className="font-mono text-[10px] text-ink-400 mt-0.5 leading-snug">
                    {alert.description}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-2.5 h-2.5 text-ink-500" />
                    <span className="font-mono text-[9px] text-ink-400">{alert.callsign} · {alert.zone}</span>
                  </div>
                </div>
              </div>

              {/* Action bar */}
              {!alert.acknowledged && (
                <div className="flex items-center border-t border-ink-700/30">
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 font-mono text-[10px] text-ink-400 hover:text-aegis-400 hover:bg-aegis-900/20 transition-colors tracking-wider"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    ACKNOWLEDGE
                  </button>
                </div>
              )}
              {alert.acknowledged && (
                <div className="flex items-center justify-center gap-1.5 py-1.5 border-t border-ink-700/30">
                  <CheckCircle2 className="w-3 h-3 text-aegis-500" />
                  <span className="font-mono text-[9px] text-aegis-600 tracking-wider">ACKNOWLEDGED</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
