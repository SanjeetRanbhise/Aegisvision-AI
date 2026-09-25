export type DroneStatus = 'active' | 'standby' | 'returning' | 'offline';

export type ThreatLevel = 'low' | 'medium' | 'high' | 'critical';

export type DetectionClass =
  | 'person'
  | 'vehicle'
  | 'structure'
  | 'weapon'
  | 'animal'
  | 'unknown';

export interface Detection {
  id: string;
  label: DetectionClass;
  confidence: number;
  x: number;
  y: number;
  w: number;
  h: number;
  threat: ThreatLevel;
  timestamp: number;
}

export interface Drone {
  id: string;
  callsign: string;
  status: DroneStatus;
  battery: number;
  altitude: number;
  speed: number;
  heading: number;
  lat: number;
  lng: number;
  signal: number;
  temperature: number;
  flightTime: number;
  feedUrl: string;
  detections: Detection[];
  zone: string;
}

export interface ThreatAlert {
  id: string;
  droneId: string;
  callsign: string;
  level: ThreatLevel;
  title: string;
  description: string;
  zone: string;
  timestamp: number;
  acknowledged: boolean;
}

export interface LogEvent {
  id: string;
  timestamp: number;
  category: 'system' | 'detection' | 'threat' | 'geofence' | 'telemetry' | 'comm';
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface GeofenceZone {
  id: string;
  name: string;
  cx: number;
  cy: number;
  r: number;
  status: 'secure' | 'breach' | 'warning';
}
