import { Battery, Gauge, Navigation, Thermometer, Signal, Clock, Mountain, Wind } from 'lucide-react';
import type { Drone } from '../types';

interface TelemetryPanelProps {
  drone: Drone;
}

export default function TelemetryPanel({ drone }: TelemetryPanelProps) {
  const isOffline = drone.status === 'offline';
  const batteryColor = drone.battery < 20 ? 'text-danger-400' : drone.battery < 40 ? 'text-amber-400' : 'text-aegis-400';
  const batteryBar = drone.battery < 20 ? 'bg-danger-500' : drone.battery < 40 ? 'bg-amber-400' : 'bg-aegis-400';
  const signalColor = drone.signal < 50 ? 'text-danger-400' : drone.signal < 70 ? 'text-amber-400' : 'text-aegis-400';

  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.floor(mins % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="flex flex-col bg-ink-900 border border-ink-700/50 clip-corner overflow-hidden h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-ink-700/40 bg-ink-850/50">
        <span className="font-display font-semibold text-xs tracking-[0.2em] text-ink-200 uppercase">
          Telemetry
        </span>
        <span className="font-mono text-[10px] text-ink-400">{drone.callsign}</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Battery */}
        <Metric icon={<Battery className={`w-4 h-4 ${batteryColor}`} />} label="BATTERY">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`font-mono text-lg font-medium tabular-nums ${batteryColor}`}>
              {isOffline ? '--' : `${Math.round(drone.battery)}%`}
            </span>
            <span className={`font-mono text-[10px] ${batteryColor}`}>
              {drone.battery < 20 ? 'CRITICAL' : drone.battery < 40 ? 'LOW' : 'NOMINAL'}
            </span>
          </div>
          <div className="h-1.5 bg-ink-800 rounded-full overflow-hidden">
            <div
              className={`h-full ${batteryBar} transition-all duration-500 ${drone.battery < 20 ? 'animate-blink' : ''}`}
              style={{ width: `${drone.battery}%` }}
            />
          </div>
        </Metric>

        {/* Altitude & Speed */}
        <div className="grid grid-cols-2 gap-2">
          <Metric icon={<Mountain className="w-4 h-4 text-cyan-400" />} label="ALTITUDE" compact>
            <span className="font-mono text-xl font-medium text-ink-100 tabular-nums">
              {isOffline ? '--' : Math.round(drone.altitude)}
            </span>
            <span className="font-mono text-[10px] text-ink-400 ml-1">m</span>
          </Metric>
          <Metric icon={<Wind className="w-4 h-4 text-cyan-400" />} label="SPEED" compact>
            <span className="font-mono text-xl font-medium text-ink-100 tabular-nums">
              {isOffline ? '--' : Math.round(drone.speed)}
            </span>
            <span className="font-mono text-[10px] text-ink-400 ml-1">kts</span>
          </Metric>
        </div>

        {/* Heading */}
        <Metric icon={<Navigation className="w-4 h-4 text-aegis-400" />} label="HEADING">
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 flex-shrink-0">
              <div className="absolute inset-0 border border-ink-600/40 rounded-full" />
              <div className="absolute inset-2 border border-ink-700/30 rounded-full" />
              <span className="absolute top-0 left-1/2 -translate-x-1/2 font-mono text-[8px] text-ink-500">N</span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-[8px] text-ink-600">S</span>
              <span className="absolute left-0 top-1/2 -translate-y-1/2 font-mono text-[8px] text-ink-600">W</span>
              <span className="absolute right-0 top-1/2 -translate-y-1/2 font-mono text-[8px] text-ink-600">E</span>
              <div
                className="absolute top-1/2 left-1/2 w-px h-5 bg-aegis-400 origin-bottom -translate-x-1/2 -translate-y-full"
                style={{ transform: `translate(-50%, -100%) rotate(${drone.heading}deg)`, transformOrigin: 'bottom center' }}
              />
              <div className="absolute top-1/2 left-1/2 w-1.5 h-1.5 -translate-x-1/2 -translate-y-1/2 bg-aegis-400 rounded-full shadow-glow-green" />
            </div>
            <div>
              <span className="font-mono text-lg font-medium text-ink-100 tabular-nums">
                {isOffline ? '--' : Math.round(drone.heading).toString().padStart(3, '0')}
              </span>
              <span className="font-mono text-sm text-ink-400">°</span>
            </div>
          </div>
        </Metric>

        {/* GPS */}
        <Metric icon={<Navigation className="w-4 h-4 text-cyan-400" />} label="GPS COORDINATES">
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-400">LAT</span>
              <span className="font-mono text-sm text-ink-100 tabular-nums">
                {isOffline ? '--' : drone.lat.toFixed(5)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-ink-400">LON</span>
              <span className="font-mono text-sm text-ink-100 tabular-nums">
                {isOffline ? '--' : drone.lng.toFixed(5)}
              </span>
            </div>
          </div>
        </Metric>

        {/* Signal & Temp */}
        <div className="grid grid-cols-2 gap-2">
          <Metric icon={<Signal className={`w-4 h-4 ${signalColor}`} />} label="SIGNAL" compact>
            <span className={`font-mono text-lg font-medium tabular-nums ${signalColor}`}>
              {isOffline ? '--' : `${Math.round(drone.signal)}%`}
            </span>
          </Metric>
          <Metric icon={<Thermometer className="w-4 h-4 text-amber-400" />} label="TEMP" compact>
            <span className="font-mono text-lg font-medium text-ink-100 tabular-nums">
              {isOffline ? '--' : Math.round(drone.temperature)}
            </span>
            <span className="font-mono text-[10px] text-ink-400 ml-0.5">°C</span>
          </Metric>
        </div>

        {/* Flight time */}
        <Metric icon={<Clock className="w-4 h-4 text-ink-300" />} label="FLIGHT TIME">
          <span className="font-mono text-lg font-medium text-ink-100 tabular-nums">
            {isOffline ? '--' : formatTime(drone.flightTime)}
          </span>
        </Metric>

        {/* System gauges */}
        <div className="pt-1 space-y-2">
          <GaugeBar label="CPU" value={isOffline ? 0 : 45 + Math.round(drone.signal / 5)} color="bg-cyan-400" />
          <GaugeBar label="AI MODEL" value={isOffline ? 0 : 78} color="bg-aegis-400" />
          <GaugeBar label="STORAGE" value={isOffline ? 0 : 62} color="bg-amber-400" />
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  children,
  compact,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={`bg-ink-850/60 border border-ink-700/30 clip-corner-sm ${compact ? 'p-2.5' : 'p-3'}`}>
      <div className="flex items-center gap-1.5 mb-1.5">
        {icon}
        <span className="font-mono text-[10px] tracking-widest text-ink-400 uppercase">{label}</span>
      </div>
      {children}
    </div>
  );
}

function GaugeBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-ink-400 tracking-wider">{label}</span>
        <span className="font-mono text-[10px] text-ink-300 tabular-nums">{value}%</span>
      </div>
      <div className="h-1 bg-ink-800 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-700`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
