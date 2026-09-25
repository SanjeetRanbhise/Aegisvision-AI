import { useState } from 'react';

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
  const {
    state,
    selectDrone,
    acknowledgeAlert,
    runRealDetection,
  } = useSimulation();

  const {
    drones,
    selectedId,
    alerts,
    logs,
    geofences,
    clock,
    systemLoad,
    aiInferences,
  } = state;

  const selectedDrone =
    drones.find(
      (drone) => drone.id === selectedId,
    ) ?? drones[0];

  const activeDrones =
    drones.filter(
      (drone) => drone.status !== 'offline',
    ).length;

  const unackAlerts =
    alerts.filter(
      (alert) => !alert.acknowledged,
    ).length;

  const [videoSource, setVideoSource] =
    useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] =
    useState(false);

  const [analysisMessage, setAnalysisMessage] =
    useState('YOLOv8 EDGE ANALYSIS READY');

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.name
        .toLowerCase()
        .endsWith('.mp4')
    ) {
      setAnalysisMessage(
        'PLEASE SELECT AN MP4 VIDEO',
      );

      event.target.value = '';

      return;
    }

    try {
      setIsAnalyzing(true);

      setAnalysisMessage(
        'UPLOADING VIDEO...',
      );

      const localVideoUrl =
        URL.createObjectURL(file);

      setVideoSource(localVideoUrl);

      setAnalysisMessage(
        'ANALYZING WITH YOLOv8...',
      );

      const result =
        await runRealDetection(file);

      if (result.annotated_video_url) {
        setVideoSource(
          result.annotated_video_url,
        );
      }

      setAnalysisMessage(
        'AI ANALYSIS COMPLETE',
      );
    } catch (error) {
      console.error(
        'AegisVision analysis error:',
        error,
      );

      setAnalysisMessage(
        error instanceof Error
          ? error.message
          : 'ANALYSIS FAILED',
      );
    } finally {
      setIsAnalyzing(false);

      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-screen bg-ink-950 text-ink-100 overflow-hidden">

      {/* TOP BAR */}
      <TopBar
        clock={clock}
        activeDrones={activeDrones}
        totalDrones={drones.length}
        systemLoad={systemLoad}
        aiInferences={aiInferences}
        unackAlerts={unackAlerts}
      />

      {/* AI STATUS / UPLOAD BAR */}
      <div className="flex items-center justify-between gap-3 px-3 py-2 bg-ink-950 border-b border-ink-700/40">

        <div className="flex items-center gap-3 min-w-0">

          <span className="w-2 h-2 rounded-full bg-aegis-400 animate-pulse" />

          <span className="font-mono text-[10px] tracking-widest text-aegis-400 uppercase">
            AEGISVISION AI
          </span>

          <span className="font-mono text-[10px] text-ink-500 truncate">
            {analysisMessage}
          </span>

        </div>

        <label className="flex-shrink-0 cursor-pointer">

          <input
            type="file"
            accept="video/mp4,.mp4"
            className="hidden"
            onChange={handleFileChange}
          />

          <span className="inline-flex px-4 py-2 bg-aegis-700/30 border border-aegis-500/40 hover:bg-aegis-600/40 text-aegis-300 font-mono text-[10px] tracking-wider transition-colors clip-corner-sm">

            {isAnalyzing
              ? 'ANALYZING...'
              : 'UPLOAD MP4'}

          </span>

        </label>

      </div>

      {/* MAIN DASHBOARD */}
      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <Sidebar
          drones={drones}
          selectedId={selectedId}
          onSelect={selectDrone}
        />

        <main className="flex-1 flex flex-col gap-2 p-2 overflow-hidden">

          {/* VIDEO + MAP */}
          <div className="flex gap-2 flex-1 min-h-0">

            {/* BIGGER VIDEO AREA */}
            <div className="flex-[4] min-w-0 min-h-0">

              <VideoFeed
                drone={selectedDrone}
                videoSource={videoSource}
              />

            </div>

            {/* SMALLER TACTICAL MAP */}
            <div className="flex-[1] min-w-0 hidden xl:flex">

              <TacticalMap
                drones={drones}
                selectedId={selectedId}
                onSelect={selectDrone}
                geofences={geofences}
              />

            </div>

          </div>

          {/* BOTTOM PANELS */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-2 h-[300px] flex-shrink-0">

            <TelemetryPanel
              drone={selectedDrone}
            />

            <DetectionPanel
              drone={selectedDrone}
            />

            <ThreatAlerts
              alerts={alerts}
              onAcknowledge={acknowledgeAlert}
            />

            <EventLog
              logs={logs}
            />

          </div>

        </main>

      </div>

    </div>
  );
}