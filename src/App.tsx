import { useSimulation } from './useSimulation';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import VideoFeed from './components/VideoFeed';
import TacticalMap from './components/TacticalMap';
import TelemetryPanel from './components/TelemetryPanel';
import DetectionPanel from './components/DetectionPanel';
import ThreatAlerts from './components/ThreatAlerts';
import EventLog from './components/EventLog';

export default function App() {
  const { state, selectDrone, acknowledgeAlert } = useSimulation();
  const { drones, selectedId, alerts, logs, geofences, clock, systemLoad, aiInferences } = state;

  const selectedDrone = drones.find((d) => d.id === selectedId) ?? drones[0];
  const activeDrones = drones.filter((d) => d.status !== 'offline').length;
  const unackAlerts = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="flex flex-col h-screen bg-ink-950 text-ink-100 overflow-hidden">
      <TopBar
        clock={clock}
        activeDrones={activeDrones}
        totalDrones={drones.length}
        systemLoad={systemLoad}
        aiInferences={aiInferences}
        unackAlerts={unackAlerts}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar drones={drones} selectedId={selectedId} onSelect={selectDrone} />

        {/* Main content */}
        <main className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">
          {/* Top row: video feed + map */}
          <div className="flex gap-2 flex-1 min-h-0">
            {/* Video feed - takes 60% */}
            <div className="flex-[3] min-w-0">
              <VideoFeed drone={selectedDrone} />
            </div>

            {/* Tactical map - takes 40% */}
            <div className="flex-[2] min-w-0 hidden xl:flex">
              <TacticalMap
                drones={drones}
                selectedId={selectedId}
                onSelect={selectDrone}
                geofences={geofences}
              />
            </div>
          </div>

          {/* Bottom row: telemetry, detections, threats, event log */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 h-[300px] flex-shrink-0">
            <TelemetryPanel drone={selectedDrone} />
            <DetectionPanel drone={selectedDrone} />
            <ThreatAlerts alerts={alerts} onAcknowledge={acknowledgeAlert} />
            <EventLog logs={logs} />
          </div>
        </main>
      </div>
    </div>
  );
}
