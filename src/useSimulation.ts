import { useEffect, useRef, useState, useCallback } from 'react';

import type {
  Drone,
  ThreatAlert,
  LogEvent,
  GeofenceZone,
  Detection,
  ThreatLevel,
} from './types';

import {
  makeDrones,
  makeDetection,
  makeThreatAlert,
  makeLogEvent,
  makeInitialLogs,
  makeGeofences,
} from './mockData';


/* =========================================================
   BACKEND CONFIG
========================================================= */

const API_BASE = 'http://127.0.0.1:8001';


/* =========================================================
   STATE TYPES
========================================================= */

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


/* =========================================================
   BACKEND RESPONSE TYPES
========================================================= */

interface BackendDetection {
  class_name: string;

  confidence: number;

  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };

  threat_level: string;

  alert_type: string;

  timestamp: string;
}


interface BackendDetectionFrame {
  frame: number;
  detections: BackendDetection[];
}



  interface BackendDetectResponse {
  success: boolean;

  filename: string;

  annotated_video?: string;

  annotated_video_url?: string;

  video: {
    width: number;
    height: number;
    fps: number;
    frame_count: number;
  };

  frames_processed: number;

  frames_with_detections: number;

  detections: BackendDetectionFrame[];
}


/* =========================================================
   LIMITS
========================================================= */

const MAX_LOGS = 80;

const MAX_ALERTS = 20;

const MAX_DETECTIONS = 8;


/* =========================================================
   MAIN HOOK
========================================================= */

export function useSimulation() {

  /* -------------------------------------------------------
     INITIAL STATE
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     STATE REF
  ------------------------------------------------------- */

  const stateRef = useRef(state);

  stateRef.current = state;


  /* =======================================================
     ADD LOG
  ======================================================= */

  const addLog = useCallback(
    (
      partial: Partial<LogEvent> & {
        category: LogEvent['category'];

        message: string;

        level: LogEvent['level'];
      },
    ) => {

      setState((s) => ({

        ...s,

        logs: [
          {
            id: `log-${Date.now()}-${Math.random()
              .toString(36)
              .slice(2, 7)}`,

            timestamp: Date.now(),

            ...partial,
          },

          ...s.logs,

        ].slice(0, MAX_LOGS),
      }));
    },

    [],
  );


  /* =======================================================
     SELECT DRONE
  ======================================================= */

  const selectDrone = useCallback(
    (id: string) => {

      setState((s) => {

        if (s.selectedId === id) {
          return s;
        }

        const drone = s.drones.find(
          (d) => d.id === id,
        );

        if (drone) {

          addLog({
            category: 'comm',

            message:
              `Operator switched feed to ${drone.callsign}`,

            level: 'info',
          });
        }

        return {
          ...s,

          selectedId: id,
        };
      });
    },

    [addLog],
  );


  /* =======================================================
     ACKNOWLEDGE ALERT
  ======================================================= */

  const acknowledgeAlert = useCallback(
    (id: string) => {

      setState((s) => ({

        ...s,

        alerts: s.alerts.map((alert) =>

          alert.id === id

            ? {
                ...alert,

                acknowledged: true,
              }

            : alert,
        ),
      }));

      addLog({
        category: 'threat',

        message:
          'Threat acknowledged by operator',

        level: 'success',
      });
    },

    [addLog],
  );


  /* =======================================================
     REAL YOLO DETECTION
  ======================================================= */

  const runRealDetection = useCallback(
    async (file: File) => {

      /* ---------------------------------------------------
         STEP 1 — UPLOAD VIDEO
      --------------------------------------------------- */

      addLog({
        category: 'system',

        message:
          `Uploading video: ${file.name}`,

        level: 'info',
      });


      const formData = new FormData();

      formData.append(
        'file',
        file,
      );


      const uploadResponse = await fetch(
        `${API_BASE}/upload`,

        {
          method: 'POST',

          body: formData,
        },
      );


      if (!uploadResponse.ok) {

        const errorText =
          await uploadResponse.text();

        throw new Error(
          `Upload failed: ${errorText}`,
        );
      }


      const uploadData =
        await uploadResponse.json();


      addLog({
        category: 'system',

        message:
          'Video uploaded successfully. Starting YOLOv8 analysis...',

        level: 'success',
      });


      /* ---------------------------------------------------
         STEP 2 — RUN YOLO
      --------------------------------------------------- */

      const detectResponse =
        await fetch(

          `${API_BASE}/detect?filename=${encodeURIComponent(
            uploadData.filename,
          )}`,

          {
            method: 'POST',
          },
        );


      if (!detectResponse.ok) {

        const errorText =
          await detectResponse.text();

        throw new Error(
          `Detection failed: ${errorText}`,
        );
      }


      const result: BackendDetectResponse =
        await detectResponse.json();


      /* ---------------------------------------------------
         STEP 3 — VIDEO DIMENSIONS
      --------------------------------------------------- */

      const videoWidth =
        result.video.width || 1;

      const videoHeight =
        result.video.height || 1;


      /* ---------------------------------------------------
         STEP 4 — CONVERT YOLO DETECTIONS
      --------------------------------------------------- */

      const allDetections: Detection[] = [];


      result.detections.forEach(
        (frameData) => {

          frameData.detections.forEach(
            (det, index) => {

              const threat =
                normalizeThreat(
                  det.threat_level,
                );


              /*
               * Convert pixel coordinates
               * into percentages.
               */

              const x =
                (det.bbox.x1 /
                  videoWidth) *
                100;


              const y =
                (det.bbox.y1 /
                  videoHeight) *
                100;


              const w =
                ((det.bbox.x2 -
                  det.bbox.x1) /
                  videoWidth) *
                100;


              const h =
                ((det.bbox.y2 -
                  det.bbox.y1) /
                  videoHeight) *
                100;


              const detection: Detection = {

                id:
                  `real-${frameData.frame}-${index}-${Date.now()}`,

                label:
                  normalizeDetectionClass(
                    det.class_name,
                  ),

                confidence:
                  det.confidence,

                x,

                y,

                w,

                h,

                threat,

                timestamp:
                  new Date(
                    det.timestamp,
                  ).getTime(),
              };


              allDetections.push(
                detection,
              );
            },
          );
        },
      );


      /* ---------------------------------------------------
         STEP 5 — KEEP BEST DETECTIONS
      --------------------------------------------------- */

      const detections =
        allDetections

          .sort(
            (a, b) =>
              b.confidence -
              a.confidence,
          )

          .slice(
            0,
            MAX_DETECTIONS,
          );


      /* ---------------------------------------------------
         STEP 6 — GET SELECTED DRONE
      --------------------------------------------------- */

      const currentState =
        stateRef.current;


      const selectedDrone =
        currentState.drones.find(
          (drone) =>
            drone.id ===
            currentState.selectedId,
        );


      if (!selectedDrone) {

        throw new Error(
          'Selected drone not found.',
        );
      }


      /* ---------------------------------------------------
         STEP 7 — CREATE THREAT ALERTS
      --------------------------------------------------- */

      const realAlerts: ThreatAlert[] =
        detections

          .filter(
            (detection) =>
              detection.threat ===
                'high' ||
              detection.threat ===
                'critical',
          )

          .map(
            (detection) => ({

              id:
                `alert-${detection.id}`,

              droneId:
                selectedDrone.id,

              callsign:
                selectedDrone.callsign,

              level:
                detection.threat,

              title:
                `${detection.label.toUpperCase()} DETECTED`,

              description:
                `YOLOv8 detected ${detection.label} with ${(detection.confidence * 100).toFixed(1)}% confidence.`,

              zone:
                selectedDrone.zone,

              timestamp:
                detection.timestamp,

              acknowledged:
                false,
            }),
          );


      /* ---------------------------------------------------
         STEP 8 — UPDATE DASHBOARD
      --------------------------------------------------- */

      setState((s) => {

        const updatedDrones =
          s.drones.map((drone) => {

            if (
              drone.id !==
              s.selectedId
            ) {

              return drone;
            }


            return {

              ...drone,

              detections:
                detections,
            };
          });


        const updatedAlerts =
          [
            ...realAlerts,

            ...s.alerts,
          ].slice(
            0,
            MAX_ALERTS,
          );


        const realLog: LogEvent = {

          id:
            `log-real-${Date.now()}`,

          timestamp:
            Date.now(),

          category:
            'detection',

          message:
            `YOLOv8 analyzed ${result.frames_processed} frames and found ${allDetections.length} detections.`,

          level:
            'success',
        };


        const updatedLogs: LogEvent[] =
          [
            realLog,

            ...s.logs,
          ].slice(
            0,
            MAX_LOGS,
          );


        return {

          ...s,

          drones:
            updatedDrones,

          alerts:
            updatedAlerts,

          logs:
            updatedLogs,

          aiInferences:
            s.aiInferences +
            result.frames_processed,

          clock:
            new Date(),
        };
      });


      /* ---------------------------------------------------
         LOG COMPLETION
      --------------------------------------------------- */

      addLog({

        category:
          'detection',

        message:
          `Analysis complete: ${result.frames_with_detections} frames contained detections.`,

        level:
          'success',
      });

      if (result.annotated_video_url) {
  result.annotated_video_url =
    `${API_BASE}${result.annotated_video_url}`;
}

      return result;
    },

    [addLog],
  );


  /* =======================================================
     SIMULATION LOOP
  ======================================================= */

  useEffect(() => {

    const tick =
      setInterval(() => {

        setState((s) => {

          const drones =
            s.drones.map((drone) => {

              if (
                drone.status ===
                'offline'
              ) {

                return drone;
              }


              const batteryDrain =
                drone.status ===
                'active'

                  ? rand(
                      0.05,
                      0.18,
                    )

                  : 0.02;


              const battery =
                Math.max(
                  0,
                  drone.battery -
                    batteryDrain,
                );


              const altitude =
                clamp(
                  drone.altitude +
                    rand(-4, 4),

                  80,

                  520,
                );


              const speed =
                clamp(
                  drone.speed +
                    rand(-3, 3),

                  0,

                  75,
                );


              const heading =
                (
                  drone.heading +
                  rand(-8, 8) +
                  360
                ) % 360;


              const signal =
                clamp(
                  drone.signal +
                    rand(-2, 2),

                  40,

                  100,
                );


              const flightTime =
                drone.flightTime +
                1;


              let detections =
                drone.detections;


              let status =
                drone.status;


              /* -------------------------------------------
                 SIMULATED DETECTION
              ------------------------------------------- */

              if (
                status === 'active' &&
                Math.random() <
                  0.35 &&
                detections.length <
                  MAX_DETECTIONS
              ) {

                detections = [
                  ...detections,

                  makeDetection(
                    drone.id,
                  ),
                ];
              }


              /* -------------------------------------------
                 REMOVE OLD DETECTION
              ------------------------------------------- */

              if (
                detections.length >
                  0 &&
                Math.random() <
                  0.25
              ) {

                detections =
                  detections.slice(1);
              }


              /* -------------------------------------------
                 AGE OUT DETECTIONS
              ------------------------------------------- */

              const now =
                Date.now();


              detections =
                detections.filter(
                  (det) =>
                    now -
                      det.timestamp <
                    12000,
                );


              /* -------------------------------------------
                 LOW BATTERY
              ------------------------------------------- */

              if (
                battery < 20 &&
                status === 'active'
              ) {

                status =
                  'returning';
              }


              return {

                ...drone,

                battery,

                altitude,

                speed,

                heading,

                signal,

                flightTime,

                detections,

                status,
              };
            });


          /* ---------------------------------------------
             SYSTEM LOAD
          --------------------------------------------- */

          const systemLoad =
            clamp(
              s.systemLoad +
                rand(-3, 3),

              25,

              88,
            );


          /* ---------------------------------------------
             AI INFERENCES
          --------------------------------------------- */

          const aiInferences =
            s.aiInferences +
            randInt(2, 9);


          return {

            ...s,

            drones,

            systemLoad,

            aiInferences,

            clock:
              new Date(),
          };
        });

      }, 1500);


    return () =>
      clearInterval(tick);

  }, []);


  /* =======================================================
     DEMO THREAT GENERATION
  ======================================================= */

  useEffect(() => {

    const threatTimer =
      setInterval(() => {

        setState((s) => {

          const activeDrones =
            s.drones.filter(
              (drone) =>
                drone.status ===
                'active',
            );


          if (
            activeDrones.length ===
              0 ||
            Math.random() > 0.5
          ) {

            return s;
          }


          const drone =
            activeDrones[
              Math.floor(
                Math.random() *
                  activeDrones.length,
              )
            ];


          const alert =
            makeThreatAlert(
              drone,
            );


          const newDrones =
            s.drones.map(
              (currentDrone) => {

                if (
                  currentDrone.id !==
                  drone.id
                ) {

                  return currentDrone;
                }


                return {

                  ...currentDrone,

                  detections:
                    [
                      ...currentDrone.detections,

                      makeDetection(
                        currentDrone.id,

                        alert.level,
                      ),
                    ].slice(
                      -MAX_DETECTIONS,
                    ),
                };
              },
            );


          const threatLog: LogEvent = {

            id:
              `log-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,

            timestamp:
              Date.now(),

            category:
              'threat',

            message:
              `${alert.level.toUpperCase()} alert: ${alert.title} — ${drone.callsign} / ${drone.zone}`,

            level:
              alert.level ===
              'critical'

                ? 'error'

                : 'warn',
          };


          return {

            ...s,

            drones:
              newDrones,

            alerts:
              [
                alert,

                ...s.alerts,
              ].slice(
                0,
                MAX_ALERTS,
              ),

            logs:
              [
                threatLog,

                ...s.logs,
              ].slice(
                0,
                MAX_LOGS,
              ),
          };
        });

      }, 7000);


    return () =>
      clearInterval(
        threatTimer,
      );

  }, []);


  /* =======================================================
     DEMO LOG GENERATION
  ======================================================= */

  useEffect(() => {

    const logTimer =
      setInterval(() => {

        setState((s) => {

          const event =
            makeLogEvent();


          return {

            ...s,

            logs:
              [
                event,

                ...s.logs,
              ].slice(
                0,
                MAX_LOGS,
              ),
          };
        });

      }, 4000);


    return () =>
      clearInterval(
        logTimer,
      );

  }, []);


  /* =======================================================
     RETURN
  ======================================================= */

  return {
  state,
  selectDrone,
  acknowledgeAlert,
  addLog,
  runRealDetection,
};
}


/* =========================================================
   HELPERS
========================================================= */


/* ---------------------------------------------------------
   BACKEND THREAT → FRONTEND THREAT
--------------------------------------------------------- */

function normalizeThreat(
  value: string,
): ThreatLevel {

  const normalized =
    value.toLowerCase();


  if (
    normalized ===
    'critical'
  ) {

    return 'critical';
  }


  if (
    normalized ===
    'high'
  ) {

    return 'high';
  }


  if (
    normalized ===
    'medium'
  ) {

    return 'medium';
  }


  return 'low';
}


/* ---------------------------------------------------------
   BACKEND CLASS → FRONTEND CLASS
--------------------------------------------------------- */

function normalizeDetectionClass(
  value: string,
): Detection['label'] {

  const normalized =
    value.toLowerCase();


  if (
    normalized ===
    'person'
  ) {

    return 'person';
  }


  if (
    normalized === 'car' ||
    normalized === 'truck' ||
    normalized === 'bus' ||
    normalized === 'motorcycle'
  ) {

    return 'vehicle';
  }


  return 'unknown';
}


/* ---------------------------------------------------------
   RANDOM NUMBER
--------------------------------------------------------- */

function rand(
  min: number,
  max: number,
): number {

  return (
    Math.random() *
    (max - min) +
    min
  );
}


/* ---------------------------------------------------------
   RANDOM INTEGER
--------------------------------------------------------- */

function randInt(
  min: number,
  max: number,
): number {

  return Math.floor(
    rand(
      min,
      max + 1,
    ),
  );
}


/* ---------------------------------------------------------
   CLAMP
--------------------------------------------------------- */

function clamp(
  value: number,
  min: number,
  max: number,
): number {

  return Math.max(
    min,
    Math.min(
      max,
      value,
    ),
  );
}