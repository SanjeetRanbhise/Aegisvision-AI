import { Shield, Radar, Activity, AlertTriangle, Radio, Settings, Power } from 'lucide-react';

interface TopBarProps {
  clock: Date;
  activeDrones: number;
  totalDrones: number;
  systemLoad: number;
  aiInferences: number;
  unackAlerts: number;
}

function formatClock(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`;
}

function formatDate(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export default function TopBar({ clock, activeDrones, totalDrones, systemLoad, aiInferences, unackAlerts }: TopBarProps) {
  return (
    <header className="relative flex items-center justify-between gap-4 px-4 h-14 bg-ink-900 border-b border-ink-700/60 noise z-30">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="flex items-center justify-center w-9 h-9 bg-aegis-900/40 border border-aegis-600/40 clip-corner-sm">
            <Shield className="w-5 h-5 text-aegis-400" strokeWidth={2.2} />
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-aegis-400 rounded-full shadow-glow-green animate-blink" />
        </div>
        <div className="leading-none">
          <h1 className="font-display font-bold text-lg tracking-[0.18em] text-ink-100">
            AEGIS<span className="text-aegis-400 text-glow-green">VISION</span>
          </h1>
          <p className="font-mono text-[10px] tracking-[0.3em] text-ink-400 uppercase mt-0.5">
            Autonomous ISR Command
          </p>
        </div>
      </div>

      {/* Center: Status indicators */}
      <div className="hidden lg:flex items-center gap-6">
        <StatusPill icon={<Radar className="w-3.5 h-3.5" />} label="DRONES" value={`${activeDrones}/${totalDrones}`} color="green" />
        <StatusPill icon={<Activity className="w-3.5 h-3.5" />} label="SYS LOAD" value={`${Math.round(systemLoad)}%`} color={systemLoad > 75 ? 'amber' : 'green'} />
        <StatusPill icon={<Radio className="w-3.5 h-3.5" />} label="AI INF" value={aiInferences.toLocaleString()} color="cyan" />
        <StatusPill
          icon={<AlertTriangle className="w-3.5 h-3.5" />}
          label="ALERTS"
          value={String(unackAlerts)}
          color={unackAlerts > 0 ? 'danger' : 'green'}
          pulse={unackAlerts > 0}
        />
      </div>

      {/* Right: Clock + controls */}
      <div className="flex items-center gap-4">
        <div className="text-right leading-none">
          <div className="font-mono text-base font-medium text-aegis-400 text-glow-green tracking-wider tabular-nums">
            {formatClock(clock)}
          </div>
          <div className="font-mono text-[10px] text-ink-400 tracking-widest mt-0.5">
            {formatDate(clock)} · UTC
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button className="flex items-center justify-center w-8 h-8 text-ink-300 hover:text-ink-100 hover:bg-ink-800 border border-transparent hover:border-ink-600/50 transition-colors clip-corner-sm">
            <Settings className="w-4 h-4" />
          </button>
          <button className="flex items-center justify-center w-8 h-8 text-danger-400 hover:text-danger-500 hover:bg-danger-700/20 border border-danger-700/40 transition-colors clip-corner-sm">
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

function StatusPill({
  icon,
  label,
  value,
  color,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'green' | 'amber' | 'danger' | 'cyan';
  pulse?: boolean;
}) {
  const colors = {
    green: 'text-aegis-400 border-aegis-700/40',
    amber: 'text-amber-400 border-amber-500/30',
    danger: 'text-danger-400 border-danger-600/40',
    cyan: 'text-cyan-400 border-cyan-600/30',
  };
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-ink-850 border ${colors[color]} clip-corner-sm`}>
      <span className={pulse ? 'animate-blink' : ''}>{icon}</span>
      <span className="font-mono text-[10px] tracking-widest text-ink-400 uppercase">{label}</span>
      <span className={`font-mono text-sm font-medium tabular-nums ${colors[color].split(' ')[0]}`}>{value}</span>
    </div>
  );
}
