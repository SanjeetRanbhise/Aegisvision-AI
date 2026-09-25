# AegisVision AI

### Edge AI for Real-Time Border & Perimeter Threat Detection

AegisVision AI is an AI-powered video surveillance and threat detection platform designed to assist operators in monitoring border and perimeter environments.

The system combines a React-based tactical dashboard with a FastAPI backend, YOLOv8 object detection, and a dedicated weapon detection model to analyze uploaded surveillance videos and generate visual threat intelligence in near real time.

---

## 🚀 Overview

Modern surveillance environments can involve multiple video feeds, limited visibility, and a large amount of visual information for operators to process.

AegisVision AI aims to reduce this cognitive load by automatically analyzing surveillance footage and highlighting potentially relevant objects and threats.

The platform provides:

- AI-powered object detection
- Person and vehicle detection
- Weapon detection
- Bounding-box visualization
- Threat classification
- Tactical monitoring interface
- Event logging
- Threat alerts
- Annotated video generation
- Browser-compatible processed video output

---

## 🎯 Problem Statement

Surveillance operators may need to continuously monitor video feeds for:

- Unauthorized personnel
- Vehicles entering restricted areas
- Potential weapons
- Suspicious activity
- Events occurring under difficult visibility conditions

Manually monitoring these feeds can increase operator workload and delay the identification of important events.

AegisVision AI provides an AI-assisted monitoring layer that automatically analyzes video and presents detected objects and potential threats through a centralized dashboard.

---

## 💡 Solution

AegisVision AI processes surveillance video through an AI detection pipeline.

```text
                Surveillance Video
                       │
                       ▼
                React Frontend
                       │
                       ▼
                  FastAPI API
                       │
              ┌────────┴────────┐
              ▼                 ▼
          YOLOv8            Weapon AI
        Object Model           Model
              │                 │
              └────────┬────────┘
                       ▼
                Detection Engine
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
      Bounding      Threat       Event
       Boxes        Analysis       Logs
          │            │            │
          └────────────┼────────────┘
                       ▼
              AegisVision Dashboard
                       │
                       ▼
              Annotated Video Output