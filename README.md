# Protocol Engine

An AI-powered digital experience transforming complex peer-reviewed research papers into executable, adaptive, and personalized health and rehabilitation protocols.

Built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**, designed for deployment to **Google Cloud Run** and integration with **Gemini on Vertex AI**.

---

## Overview

Peer-reviewed clinical literature is notoriously dense and difficult for patients and athletes to follow safely. **Protocol Engine** bridges this gap by:
- Ingesting scientific PDFs and isolating actionable methods, dosing, tempo, and contraindications.
- **The "Morphing" Pipeline (Schema-Driven Adaptive UI)**: Dynamically generating bespoke data collection widgets and dashboard analytics tailored to the study's endpoints (photo uploads for dermatology/posture, numeric biomarker steppers for blood glucose, reaction timers for cognitive trials, or 0–10 sliders for physical therapy).
- Translating trial parameters into personalized daily routines with live set tracking and smart biofeedback scoring.
- Applying adaptive progression rules: automatically pausing escalation and recommending load/dosage reductions when adverse symptom or tolerability thresholds are exceeded.
- Providing an AI paper assistant for Q&A grounded directly in the study's Methods and Interventions section.

---

## The "Morphing" Pipeline (Schema-Driven Adaptive UI)

A core innovation of Protocol Engine is **Schema-Driven Adaptive UI** (Generative UI). Instead of forcing every clinical study into an identical generic slider or checkbox, the research paper dynamically constructs its own user interface:

```text
Research Paper (PDF)
      │
      ▼
[1. Extraction Layer — Gemini Multimodal]
  Analyzes "Methods" & "Outcomes" sections to isolate trial endpoints
  Outputs declarative `dataCollectionSpec` array alongside physical steps
      │
      ▼
[2. Registry Layer — Polymorphic Component Factory]
  <DynamicFieldRenderer /> mounts exact matching UI primitives:
  • 'scale'       ➔ Severity-toned 0–10 visual analog slider
  • 'photo'       ➔ Camera/upload widget with alignment guidelines
  • 'numeric'     ➔ Stepper with unit validation (e.g. mg/dL, mmHg)
  • 'timer'       ➔ Countdown/stopwatch for functional mobility tests
  • 'multichoice' ➔ Single-tap clinical chip selectors
      │
      ▼
[3. Presentation Layer — Milestone Awareness & Adaptive Dashboards]
  • Daily vs Milestone Scheduling (e.g., photo check-ins on Day 1, 14, 30 only)
  • Morphing Dashboard Visualizers:
    - Photos ➔ Interactive Before / After split comparison slider
    - Numbers ➔ Clinical biomarker trend curves with normal ranges
    - Scales ➔ Tolerability and load escalation pause timelines
```

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, CSS variables with alpha-channel support
- **UI & Animation**: Framer Motion, Material UI Icons
- **Data Visualization**: Recharts (with SSR-safe client-side dynamic rendering)
- **Notifications**: Sonner
- **AI & Cloud Backend**: Ready for Gemini on Vertex AI & Google Cloud Run (`output: 'standalone'`)

---

## Getting Started

### Prerequisites
- Node.js 18.17+ or 20+
- npm or pnpm

### Installation

```bash
npm install
```

### Development Server

Run the development server locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

Create an optimized standalone production build:

```bash
npm run build
npm run start
```

### Google Cloud Run Deployment

Protocol Engine uses Next.js 14 `output: 'standalone'` and a multi-stage Dockerfile producing a minimal (<150MB) production container image.

#### 1. One-Click Deploy via Google Cloud Run
Deploy directly from local source to Google Cloud Run using Cloud Build:

```bash
gcloud run deploy protocol-engine \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="your-gemini-api-key",NODE_ENV="production"
```

#### 2. Local Container Build & Verification
You can build and test the container image locally with Docker:

```bash
# Build the production image
docker build -t protocol-engine:latest .

# Run container locally on port 3000
docker run -p 3000:3000 -e GEMINI_API_KEY="your-gemini-api-key" protocol-engine:latest
```

---

## Project Structure

```text
├── src/
│   ├── app/                    # Next.js App Router (pages & layout)
│   │   ├── api/                # API Route Handlers (Vertex AI & PDF extract)
│   │   ├── community/          # Community evidence insights route
│   │   ├── dashboard/          # Protocol tracking & metrics route
│   │   ├── layout.tsx          # Root layout & font configuration
│   │   ├── page.tsx            # Main daily routine route
│   │   └── providers.tsx       # Client context providers
│   ├── components/             # Reusable UI & domain components
│   │   ├── assistant/          # AI Paper Assistant sheet & message bubbles
│   │   ├── community/          # Adherence & drop-off charts
│   │   ├── dashboard/          # Stat cards & progression panels
│   │   ├── feedback/           # Error boundary, fallbacks, callouts
│   │   ├── layout/             # Shell, sidebar, topbar, mobile nav
│   │   ├── protocol/           # Step rows, paper pickers, switchers
│   │   ├── routine/            # Set counters, biofeedback scale slider, calendar
│   │   └── ui/                 # Atomic design tokens (buttons, badges, icons)
│   ├── contexts/               # React Contexts (ProtocolState, AssistantState)
│   ├── data/                   # Centralized copy, config, and study data
│   ├── hooks/                  # Custom hooks (a11y, file drop, timers)
│   ├── types/                  # Domain TypeScript interfaces
│   └── utils/                  # Safe math, metrics, time, and class utilities
├── next.config.mjs             # Next.js standalone container configuration
├── tailwind.config.js          # Design system color & typography tokens
└── tsconfig.json               # TypeScript path alias configuration
```

---

## License

Private / Proprietary.
