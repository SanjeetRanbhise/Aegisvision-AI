import { useEffect, useState } from 'react';
import { ScrollText, Cpu, Eye, Shield, Radio, Activity, MapPin } from 'lucide-react';
import type { LogEvent } from '../types';

interface EventLogProps {
  logs: LogEvent[];
}

const CATEGORY_ICON: Record<LogEvent['category'], React.ReactNode> = {
  system: <Cpu className="w-3 h-3" />,
  detection: <Eye className="w-3 h-3" />,
  threat: <Shield className="w-3 h-3" />,
  geofence: <MapPin className="w-3 h-3" />,
  telemetry: <Activity className="w-3 h-3" />,
  comm: <Radio className="w-3 h-3" />,
};

const LEVEL_CONFIG: Record<LogEvent['level'], { color: string; border: string }> = {
  info: { color: 'text-ink-300', border: 'border-l-ink-600' },
  warn: { color: 'text-amber-400', border: 'border-l-amber-500' },
  error: { color: 'text-danger-400', border: 'border-l-danger-500' },
  success: { color: 'text-aegis-400', border: 'border-l-aegis-500' },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`;
}

export default function EventLog({ logs }: EventLogProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (autoScroll && containerRef) {
      containerRef.scrollTop = 0;
    }
  }, [logs, autoScroll, containerRef]);

  return (
    <div className="flex flex-col bg-ink-900 border border-ink-700/50 clip-corner overflow-hidden h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-700/40 bg-ink-850/50">
        <div className="flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-cyan-400" />
          <span className="font-display font-semibold text-xs tracking-[0.2em] text-ink-200 uppercase">
            Event Log
          </span>
        </div>
        <button
          onClick={() => setAutoScroll((v) => !v)}
          className={`font-mono text-[10px] tracking-wider px-2 py-0.5 border clip-corner-sm transition-colors ${
            autoScroll
              ? 'text-aegis-400 border-aegis-700/40 bg-aegis-900/20'
              : 'text-ink-400 border-ink-600/30 hover:text-ink-200'
          }`}
        >
          {autoScroll ? 'AUTO' : 'MANUAL'}
        </button>
      </div>

      <div ref={setContainerRef} className="flex-1 overflow-y-auto">
        {logs.map((log) => {
          const c = LEVEL_CONFIG[log.level];
          return (
            <div
              key={log.id}
              className={`flex items-start gap-2 px-3 py-1.5 border-l-2 ${c.border} hover:bg-ink-850/50 transition-colors animate-fade-in`}
            >
              <span className="font-mono text-[10px] text-ink-500 tabular-nums flex-shrink-0 mt-0.5">
                {formatTime(log.timestamp)}
              </span>
              <span className={`flex-shrink-0 mt-0.5 ${c.color}`}>{CATEGORY_ICON[log.category]}</span>
              <span className={`font-mono text-[11px] leading-snug ${c.color}`}>
                <span className="text-ink-500 uppercase text-[9px] tracking-wider mr-1.5">
                  [{log.category}]
                </span>
                {log.message}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-3 py-1.5 border-t border-ink-700/40 bg-ink-850/50">
        <span className="font-mono text-[10px] text-ink-500">{logs.length} events</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-aegis-400 animate-blink" />
          <span className="font-mono text-[10px] text-ink-500">streaming</span>
        </div>
      </div>
    </div>
  );
}
