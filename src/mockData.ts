import type {
  Drone,
  Detection,
  ThreatAlert,
  LogEvent,
  ThreatLevel,
  DetectionClass,
  GeofenceZone,
} from './types';

const FEEDS = [
  'https://images.pexels.com/photos/16579372/pexels-photo-16579372.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&fit=crop',
  'https://images.pexels.com/photos/2415927/pexels-photo-2415927.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&fit=crop',
  'https://images.pexels.com/photos/1916736/pexels-photo-1916736.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&fit=crop',
  'https://images.pexels.com/photos/1813999/pexels-photo-1813999.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&fit=crop',
  'https://images.pexels.com/photos/3763774/pexels-photo-3763774.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&fit=crop',
  'https://images.pexels.com/photos/2250726/pexels-photo-2250726.jpeg?auto=compress&cs=tinysrgb&w=1280&h=720&fit=crop',
];

const ZONES = ['SECTOR-7A', 'BORDER-NORTH', 'PERIMETER-EAST', 'VALLEY-PASS', 'RIDGE-LINE', 'DELTA-ZONE'];

const DETECTION_CLASSES: { label: DetectionClass; weight: number; threat: ThreatLevel }[] = [
  { label: 'person', weight: 30, threat: 'medium' },
  { label: 'vehicle', weight: 22, threat: 'medium' },
  { label: 'structure', weight: 14, threat: 'low' },
  { label: 'weapon', weight: 8, threat: 'critical' },
  { label: 'unknown', weight: 8, threat: 'high' },
];

const THREAT_TITLES: Record<ThreatLevel, string[]> = {
  low: ['Movement detected', 'Routine contact', 'Perimeter check'],
  medium: ['Unauthorized person', 'Vehicle approaching', 'Suspicious activity'],
  high: ['Unknown contact', 'Armed individual suspected', 'Rapid movement'],
  critical: ['Weapon detected', 'Geofence breach', 'Hostile contact'],
};

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${(++idCounter).toString(36)}`;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number): number {
  return Math.floor(rand(min, max + 1));
}

function weightedPick<T extends { weight: number }>(items: T[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export function makeDetection(droneId: string, forceThreat?: ThreatLevel): Detection {
  const cls = weightedPick(DETECTION_CLASSES);
  const threat = forceThreat ?? cls.threat;
  const w = rand(8, 22);
  const h = rand(8, 22);
  return {
    id: uid('det'),
    label: cls.label,
    confidence: rand(0.72, 0.99),
    x: rand(8, 88 - w),
    y: rand(8, 88 - h),
    w,
    h,
    threat,
    timestamp: Date.now(),
  };
}

export function makeDrone(index: number): Drone {
  const status = index === 0 ? 'active' : pick<Drone['status']>(['active', 'standby', 'returning', 'offline']);
  return {
    id: `drone-${index + 1}`,
    callsign: `AV-${String(index + 1).padStart(3, '0')}`,
    status,
    battery: status === 'offline' ? 0 : randInt(35, 100),
    altitude: status === 'offline' ? 0 : randInt(120, 480),
    speed: status === 'offline' ? 0 : randInt(0, 65),
    heading: randInt(0, 359),
    lat: 34.0522 + rand(-0.08, 0.08),
    lng: -118.2437 + rand(-0.08, 0.08),
    signal: status === 'offline' ? 0 : randInt(60, 100),
    temperature: randInt(18, 42),
    flightTime: status === 'offline' ? 0 : randInt(12, 184),
    feedUrl: FEEDS[index % FEEDS.length],
    detections: [],
    zone: ZONES[index % ZONES.length],
  };
}

export function makeDrones(count: number): Drone[] {
  return Array.from({ length: count }, (_, i) => makeDrone(i));
}

export function makeThreatAlert(drone: Drone): ThreatAlert {
  const level = pick<ThreatLevel>(['medium', 'medium', 'high', 'critical']);
  return {
    id: uid('alert'),
    droneId: drone.id,
    callsign: drone.callsign,
    level,
    title: pick(THREAT_TITLES[level]),
    description: `AI classified ${level} threat in ${drone.zone}. Confidence ${rand(0.8, 0.97).toFixed(2)}.`,
    zone: drone.zone,
    timestamp: Date.now(),
    acknowledged: false,
  };
}

export function makeLogEvent(): LogEvent {
  const cats: LogEvent['category'][] = ['system', 'detection', 'threat', 'geofence', 'telemetry', 'comm'];
  const levels: LogEvent['level'][] = ['info', 'info', 'info', 'warn', 'success', 'error'];
  const msgs: Record<LogEvent['category'], string[]> = {
    system: ['System self-check passed', 'AI model inference cycle complete', 'Heartbeat OK'],
    detection: ['New object classified', 'Tracking lock acquired', 'Detection confidence updated'],
    threat: ['Threat level escalated', 'Alert generated', 'Threat acknowledged by operator'],
    geofence: ['Geofence perimeter verified', 'Boundary contact detected', 'Zone re-secured'],
    telemetry: ['Battery nominal', 'Altitude adjusted', 'Signal strength stable'],
    comm: ['Uplink established', 'Telemetry stream synced', 'Command packet received'],
  };
  const cat = pick(cats);
  return {
    id: uid('log'),
    timestamp: Date.now(),
    category: cat,
    message: pick(msgs[cat]),
    level: pick(levels),
  };
}

export function makeInitialLogs(count: number): LogEvent[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    ...makeLogEvent(),
    timestamp: now - (count - i) * randInt(2000, 9000),
  }));
}

export function makeGeofences(): GeofenceZone[] {
  return [
    { id: 'gf-1', name: 'SECTOR-7A', cx: 30, cy: 35, r: 14, status: 'secure' },
    { id: 'gf-2', name: 'BORDER-NORTH', cx: 68, cy: 28, r: 16, status: 'warning' },
    { id: 'gf-3', name: 'PERIMETER-EAST', cx: 55, cy: 70, r: 12, status: 'breach' },
    { id: 'gf-4', name: 'DELTA-ZONE', cx: 22, cy: 72, r: 10, status: 'secure' },
  ];
}
