import {
  useEffect,
  useState,
} from 'react';

import {
  Camera,
  Crosshair,
  Maximize2,
  Radio,
  Video,
} from 'lucide-react';

import type { Drone } from '../types';

interface VideoFeedProps {
  drone: Drone;
  videoSource?: string | null;
}

export default function VideoFeed({
  drone,
  videoSource,
}: VideoFeedProps) {
  const [feedLoaded, setFeedLoaded] =
    useState(false);

  const [videoError, setVideoError] =
    useState(false);

  const isOffline =
    drone.status === 'offline';

  useEffect(() => {
    setFeedLoaded(false);
    setVideoError(false);
  }, [videoSource, drone.id]);

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden bg-black border border-ink-700/50">

      {/* HEADER */}
      <div className="absolute top-0 left-0 right-0 z-30 h-12 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between px-4">

        <div className="flex items-center gap-3">

          <div
            className={`flex items-center gap-2 font-mono text-xs tracking-wider ${
              isOffline
                ? 'text-ink-500'
                : 'text-red-400'
            }`}
          >

            <span
              className={`w-2 h-2 rounded-full ${
                isOffline
                  ? 'bg-ink-600'
                  : 'bg-red-500 animate-pulse'
              }`}
            />

            {isOffline
              ? 'OFFLINE'
              : 'LIVE'}

          </div>

          <Video
            size={15}
            className="text-ink-500"
          />

          <span className="font-mono text-sm text-ink-300">
            {drone.callsign}
          </span>

          <span className="text-ink-600">
            /
          </span>

          <span className="font-mono text-xs text-ink-500">
            {drone.sector}
          </span>

        </div>

        <div className="flex items-center gap-4 text-ink-500">

          <Crosshair size={15} />

          <Camera size={15} />

          <Radio size={15} />

          <Maximize2 size={15} />

        </div>

      </div>

      {/* VIDEO / IMAGE AREA */}
      <div className="absolute inset-0 flex items-center justify-center bg-black">

        {/* UPLOADED / ANALYZED VIDEO */}
        {!isOffline &&
          videoSource &&
          !videoError && (
            <video
              key={videoSource}
              src={videoSource}
              autoPlay
              muted
              loop
              playsInline
              controls={false}
              onLoadedData={() =>
                setFeedLoaded(true)
              }
              onError={() =>
                setVideoError(true)
              }
              className={`w-full h-full object-contain transition-opacity duration-700 ${
                feedLoaded
                  ? 'opacity-100'
                  : 'opacity-0'
              }`}
            />
          )}

        {/* DEFAULT DRONE FEED */}
        {!isOffline &&
          !videoSource &&
          !videoError && (
            <img
              src={drone.feedUrl}
              alt={`${drone.callsign} feed`}
              onLoad={() =>
                setFeedLoaded(true)
              }
              onError={() =>
                setVideoError(true)
              }
              className={`w-full h-full object-cover transition-opacity duration-700 ${
                feedLoaded
                  ? 'opacity-80'
                  : 'opacity-0'
              }`}
            />
          )}

        {/* LOADING */}
        {!isOffline &&
          !feedLoaded &&
          !videoError && (
            <div className="absolute inset-0 flex items-center justify-center">

              <div className="font-mono text-[10px] tracking-widest text-aegis-400 animate-pulse">
                INITIALIZING VIDEO FEED...
              </div>

            </div>
          )}

        {/* VIDEO ERROR */}
        {videoError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-ink-950">

            <Video
              size={32}
              className="text-ink-600 mb-3"
            />

            <div className="font-mono text-xs text-red-400">
              VIDEO FEED ERROR
            </div>

            <div className="font-mono text-[9px] text-ink-600 mt-1">
              UNABLE TO LOAD VIDEO SOURCE
            </div>

          </div>
        )}

        {/* OFFLINE */}
        {isOffline && (
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950">

            <div className="text-center">

              <Radio
                size={32}
                className="mx-auto text-ink-700 mb-3"
              />

              <div className="font-mono text-xs text-ink-600 tracking-widest">
                SIGNAL LOST
              </div>

              <div className="font-mono text-[9px] text-ink-700 mt-1">
                {drone.callsign} OFFLINE
              </div>

            </div>

          </div>
        )}

        {/* SCANLINE EFFECT */}
        {!isOffline &&
          feedLoaded && (
            <div className="absolute inset-0 pointer-events-none opacity-[0.06] z-10 bg-[linear-gradient(to_bottom,transparent_50%,rgba(255,255,255,0.15)_50%)] bg-[length:100%_4px]" />
          )}

        {/* VIDEO CORNERS */}
        {!isOffline &&
          feedLoaded && (
            <>
              <div className="absolute top-14 left-3 w-5 h-5 border-l border-t border-aegis-400/50 pointer-events-none z-20" />

              <div className="absolute top-14 right-3 w-5 h-5 border-r border-t border-aegis-400/50 pointer-events-none z-20" />

              <div className="absolute bottom-3 left-3 w-5 h-5 border-l border-b border-aegis-400/50 pointer-events-none z-20" />

              <div className="absolute bottom-3 right-3 w-5 h-5 border-r border-b border-aegis-400/50 pointer-events-none z-20" />
            </>
          )}

      </div>

      {/* TOP TELEMETRY */}
      {!isOffline && (
        <div className="absolute top-14 left-4 z-30 font-mono text-[10px] text-ink-300 space-y-1">

          <div>
            ALT&nbsp;
            <span className="text-ink-100">
              {drone.altitude ?? '---'}m
            </span>
          </div>

          <div>
            SPD&nbsp;
            <span className="text-ink-100">
              {drone.speed ?? '---'}kts
            </span>
          </div>

          <div>
            HDG&nbsp;
            <span className="text-ink-100">
              {drone.heading ?? '---'}°
            </span>
          </div>

        </div>
      )}

      {/* GPS */}
      {!isOffline && (
        <div className="absolute top-14 right-4 z-30 font-mono text-right text-[10px] space-y-1">

          <div className="text-aegis-300">
            {drone.position
              ? drone.position.lat.toFixed(4)
              : '----'}{' '}
            LAT
          </div>

          <div className="text-aegis-300">
            {drone.position
              ? drone.position.lng.toFixed(4)
              : '----'}{' '}
            LON
          </div>

          <div className="text-ink-400">
            {drone.battery ?? '---'}% BAT
          </div>

        </div>
      )}

      {/* RECORDING */}
      {!isOffline &&
        feedLoaded && (
          <div className="absolute bottom-4 left-4 z-30 flex items-center gap-2 px-3 py-2 bg-black/70 border border-red-500/20">

            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />

            <span className="font-mono text-[10px] text-ink-300">
              REC
            </span>

          </div>
        )}

      {/* OBJECT COUNT */}
      {!isOffline &&
        drone.detections &&
        drone.detections.length > 0 && (
          <div className="absolute bottom-4 right-4 z-30 px-3 py-2 bg-black/70 border border-aegis-500/20">

            <span className="font-mono text-[10px] text-aegis-300">
              {drone.detections.length}{' '}
              OBJECTS TRACKED
            </span>

          </div>
        )}

    </div>
  );
}