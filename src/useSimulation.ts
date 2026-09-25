import { useEffect, useRef, useState, useCallback } from 'react';
import type { Drone, ThreatAlert, LogEvent, GeofenceZone } from './types';
import { makeDrones, makeDetection, makeThreatAlert, makeLogEvent, makeInitialLogs, makeGeofences } from './mockData';

interface SimState {
  drones: Drone[];
  selectedId: string;
  alerts: ThreatAlert[];
  logs: LogEvent[];
  geofences: GeofenceZone[];
  clock: Date;
  systemLoad: number;
  aiInferences: number;
}

const MAX_LOGS = 80;
const MAX_ALERTS = 20;
const MAX_DETECTIONS = 8;

export function useSimulation() {
  const [state, setState] = useState<SimState>(() => {
    const drones = makeDrones(6);
    return {
      drones,
      selectedId: drones[0].id,
      alerts: [],
      logs: makeInitialLogs(24),
      geofences: makeGeofences(),
      clock: new Date(),
      systemLoad: 42,
      aiInferences: 0,
    };
  });

  const stateRef = useRef(state);
  stateRef.current = state;

  const addLog = useCallback((partial: Partial<LogEvent> & { category: LogEvent['category']; message: string; level: LogEvent['level'] }) => {
    setState((s) => ({
      ...s,
      logs: [{ id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now(), ...partial }, ...s.logs].slice(0, MAX_LOGS),
    }));
  }, []);

  const selectDrone = useCallback((id: string) => {
    setState((s) => {
      if (s.selectedId === id) return s;
      const drone = s.drones.find((d) => d.id === id);
      if (drone) {
        addLog({ category: 'comm', message: `Operator switched feed to ${drone.callsign}`, level: 'info' });
      }
      return { ...s, selectedId: id };
    });
  }, [addLog]);

  const acknowledgeAlert = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      alerts: s.alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a)),
    }));
    addLog({ category: 'threat', message: 'Threat acknowledged by operator', level: 'success' });
  }, [addLog]);

  // Main simulation loop
  useEffect(() => {
    const tick = setInterval(() => {
      setState((s) => {
        const drones = s.drones.map((d) => {
          if (d.status === 'offline') return d;

          const batteryDrain = d.status === 'active' ? rand(0.05, 0.18) : 0.02;
          const battery = Math.max(0, d.battery - batteryDrain);
          const altitude = clamp(d.altitude + rand(-4, 4), 80, 520);
          const speed = clamp(d.speed + rand(-3, 3), 0, 75);
          const heading = (d.heading + rand(-8, 8) + 360) % 360;
          const signal = clamp(d.signal + rand(-2, 2), 40, 100);
          const flightTime = d.flightTime + 1;

          let detections = d.detections;
          let status = d.status;

          // Add detections for active drones
          if (status === 'active' && Math.random() < 0.35 && detections.length < MAX_DETECTIONS) {
            detections = [...detections, makeDetection(d.id)];
          }
          // Remove old detections
          if (detections.length > 0 && Math.random() < 0.25) {
            detections = detections.slice(1);
          }
          // Age out detections
          const now = Date.now();
          detections = detections.filter((det) => now - det.timestamp < 12000);

          // Low battery return
          if (battery < 20 && status === 'active') {
            status = 'returning';
          }

          return { ...d, battery, altitude, speed, heading, signal, flightTime, detections, status };
        });

        // System load fluctuation
        const systemLoad = clamp(s.systemLoad + rand(-3, 3), 25, 88);
        const aiInferences = s.aiInferences + randInt(2, 9);

        return { ...s, drones, systemLoad, aiInferences, clock: new Date() };
      });
    }, 1500);
    return () => clearInterval(tick);
  }, []);

  // Threat generation loop
  useEffect(() => {
    const threatTimer = setInterval(() => {
      setState((s) => {
        const activeDrones = s.drones.filter((d) => d.status === 'active');
        if (activeDrones.length === 0 || Math.random() > 0.5) return s;

        const drone = activeDrones[Math.floor(Math.random() * activeDrones.length)];
        const alert = makeThreatAlert(drone);

        // Add a critical detection to the drone
        const newDrones = s.drones.map((d) =>
          d.id === drone.id
            ? { ...d, detections: [...d.detections, makeDetection(d.id, alert.level)].slice(-MAX_DETECTIONS) }
            : d,
        );

        return {
          ...s,
          drones: newDrones,
          alerts: [alert, ...s.alerts].slice(0, MAX_ALERTS),
          logs: [
            { id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, timestamp: Date.now(), category: 'threat' as const, message: `${alert.level.toUpperCase()} alert: ${alert.title} — ${drone.callsign} / ${drone.zone}`, level: alert.level === 'critical' ? 'error' as const : 'warn' as const },
            ...s.logs,
          ].slice(0, MAX_LOGS),
        };
      });
    }, 7000);
    return () => clearInterval(threatTimer);
  }, []);

  // Log generation loop
  useEffect(() => {
    const logTimer = setInterval(() => {
      setState((s) => {
        const e = makeLogEvent();
        return { ...s, logs: [e, ...s.logs].slice(0, MAX_LOGS) };
      });
    }, 4000);
    return () => clearInterval(logTimer);
  }, []);

  return { state, selectDrone, acknowledgeAlert, addLog };
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
