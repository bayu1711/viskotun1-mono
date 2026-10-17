# ViskotuN1

An AI-powered digital experience transforming complex peer-reviewed research papers into executable, adaptive, and personalized health and rehabilitation routines.

Built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**, designed for deployment to **Google Cloud Run** and integration with **Gemini on Vertex AI**.

---

## Overview

Peer-reviewed clinical literature is notoriously dense and difficult for patients and athletes to follow safely. **ViskotuN1** bridges this gap by:
- Ingesting scientific PDFs and isolating actionable methods, dosing, tempo, and contraindications.
- **The "Morphing" Pipeline (Schema-Driven Adaptive UI)**: Dynamically generating bespoke data collection widgets and dashboard analytics tailored to the study's endpoints (photo uploads for dermatology/posture, numeric biomarker steppers for blood glucose, reaction timers for cognitive trials, or 0–10 sliders for physical therapy).
- Translating trial parameters into personalized daily routines with live set tracking and smart biofeedback scoring.
- Applying adaptive progression rules: automatically pausing escalation and recommending load/dosage reductions when adverse symptom or tolerability thresholds are exceeded.
- Providing an AI paper assistant for Q&A grounded directly in the study's Methods and Interventions section.

---

## The "Morphing" Pipeline (Schema-Driven Adaptive UI)

A core innovation of ViskotuN1 is **Schema-Driven Adaptive UI** (Generative UI). Instead of forcing every clinical study into an identical generic slider or checkbox, the research paper dynamically constructs its own user interface:

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

## Hybrid AI Architecture: Cloud Gemini + Edge Gemma

ViskotuN1 employs a **Hybrid AI Tiering** model designed to optimize cost, latency, and patient privacy:

```text
                                  User Action
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
[PDF Ingestion & Schema Extraction]                       [Daily Adherence Q&A]
                │                                                     │
                ▼                                                     ▼
    Gemini 1.5/2.0 Flash (Cloud)                          3-Tier Fallback Cascade:
  • 1M+ token context window                             1. Edge Gemma (window.ai)
  • Ingests 30-page clinical papers                        • 100% on-device (Chrome AI)
  • Multi-column tables & dosing extraction                • $0 API cost, 0ms latency
  • Generates `dataCollectionSpec`                         • Complete medical data privacy
                                                         2. Cloud Gemini Flash
                                                           • High-reasoning fallback
                                                         3. Offline Rule Matcher
                                                           • Deterministic paper citation
```

1. **Cloud Tier (Gemini Flash)**: Handles complex multimodal document processing where a large context window and multimodal OCR are essential.
2. **Edge Tier (Gemma on-device)**: Handles repetitive daily routine Q&A through Chrome Built-in AI (`window.ai`). Patient health queries never leave the device.
3. **Private Server Tier (Gemma Endpoint)**: Supports connecting private self-hosted Gemma 2 instances via Ollama or Google Vertex AI Model Garden (`GEMMA_ENDPOINT_URL`).

---

## Dynamic Guardrail Policy Ledger (Google Cloud Firestore)

In safety-critical clinical and health applications, hardcoded thresholds in code are insufficient when medical advisory guidelines or contraindications update. ViskotuN1 features a **Dynamic Guardrail Policy Ledger** backed by **Google Cloud Firestore**:

```text
                                  ┌───────────────────────────────┐
                                  │ Google Cloud Firestore        │
                                  │ (collection: 'policies')      │
                                  │ doc: 'clinical_guardrails'    │
                                  └──────────────┬────────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Next.js Server Policy Ledger (src/server/guardrailLedger.ts)                │
│  • Hot memory cache (1-min TTL) for sub-millisecond request resolution     │
│  • Automatic fail-safe fallback to baseline standards if offline/unconfigured│
│  • Injects dynamic gatekeeper criteria & adverse thresholds into Gemini    │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │
       ┌───────┴───────────────────────────────┐
       ▼                                       ▼
┌───────────────────────────────┐  ┌───────────────────────────────────────────┐
│ /api/extract & /api/assistant │  │ /api/admin/guardrails                     │
│ Dynamic gatekeeping, adverse  │  │ GET: Live ledger health & active policy   │
│ threshold injection & safety  │  │ POST: Dynamic policy tuning without rebuild│
│ advisories                    │  │ DELETE: Reset to clinical baseline       │
└───────────────────────────────┘  └───────────────────────────────────────────┘
```

- **Zero-Downtime Policy Tuning**: Clinical administrators can update adverse escalation thresholds, load reduction percentages, and gatekeeper criteria on the fly without rebuilding or redeploying Docker containers.
- **Fail-Safe Baseline**: If Google Cloud credentials are omitted in local development, the ledger operates seamlessly using an in-memory hot cache initialized with conservative clinical standards.
- **Interactive UI Inspector**: Tap the **Shield** icon in the TopBar to inspect live policy provenance, view Firestore connectivity status, and test dynamic policy updates in real time.

---

## Zero-Hallucination Parameter Resolution (3-Tier Clinical Pipeline)

When academic papers describe interventions in their Methods section, authors frequently omit minor execution parameters (e.g., stating *"participants performed static stretching"* without publishing hold duration or sets). Rather than silently hallucinating numbers or breaking protocol execution, ViskotuN1 executes a deterministic **3-Tier Resolution Pipeline**:

```text
Paper Omission Detected (e.g., Calf Stretch hold duration missing)
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Tier 1: Scientific Lineage Resolution (Reference Tree Scan)                 │
│  • Checks the author's bibliography and cited predecessors (e.g. Ref [14])  │
│  • Inherits documented execution parameters directly from the parent study  │
│  • UI Attribution: [Lineage: Ref 14 · Alfredson et al. 1998]                │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ (If not found in citations)
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Tier 2: Clinical Consensus Fallback OR Safe Omission                        │
│  • Essential Adjunct: Queries clinical standards of care (e.g. ACSM, NICE, │
│    Cochrane) and applies the lowest-risk, conservative baseline             │
│    UI Attribution: [Inferred: ACSM Clinical Guideline · 30s]                │
│  • Non-Essential / Ambiguous: AI safely omits the step entirely rather than │
│    fabricating arbitrary activities                                         │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Tier 3: In-Situ User Agency & Non-Punitive Compliance                       │
│  • Zero Friction: Step is pre-loaded with baseline (no upfront cognitive    │
│    burden on everyday users)                                                │
│  • Contextual Card Badge: Parameter provenance displayed directly on the    │
│    exercise task card (eliminates intrusive, persistent top banners)        │
│  • 1-Click "Ignore / Exclude": Users or clinicians can exclude the inferred │
│    step without penalty — daily adherence rings instantly re-normalize      │
│    to 100% based strictly on the trial's core validated steps               │
└─────────────────────────────────────────────────────────────────────────────┘
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

Open [http://localhost:3010](http://localhost:3010) in your browser.

### Production Build

Create an optimized standalone production build:

```bash
npm run build
npm run start
```

### Google Cloud Run Deployment

ViskotuN1 uses Next.js 14 `output: 'standalone'` and a multi-stage Dockerfile producing a minimal (<150MB) production container image.

#### 1. One-Click Deploy via Google Cloud Run
Deploy directly from local source to Google Cloud Run using Cloud Build:

```bash
gcloud run deploy viskotun1 \
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
docker build -t viskotun1:latest .

# Run container locally on port 3000
docker run -p 3000:3000 -e GEMINI_API_KEY="your-gemini-api-key" viskotun1:latest
```

---

### Environment Variables

Copy `.env.example` to `.env.local` to configure your local development environment:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Recommended | Gemini API key from Google AI Studio for paper extraction and Q&A. If omitted, high-fidelity offline mock routines are used. |
| `GEMINI_MODEL` | Optional | Gemini model name (default: `gemini-1.5-flash` or `gemini-2.0-flash`). |
| `GOOGLE_CLOUD_PROJECT` | Optional | Google Cloud Project ID for Cloud Run deployment and Firestore integration. |
| `FIRESTORE_DATABASE_ID` | Optional | Dedicated Firestore database ID (configured: `viskotun1-database`). |
| `NEXT_PUBLIC_FIREBASE_*` | Optional | Firebase Web Client SDK parameters for live Google OAuth and Email authentication. |
| `GEMMA_ENDPOINT_URL` | Optional | URL to a self-hosted Gemma 2 instance (e.g. Ollama or Vertex AI Model Garden). |

---

## Project Structure

```text
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── api/                    # Server Route Handlers
│   │   │   ├── admin/guardrails/   # Dynamic Firestore policy ledger API
│   │   │   ├── assistant/          # Hybrid AI Q&A endpoint
│   │   │   ├── extract/            # Multimodal PDF extraction endpoint
│   │   │   ├── tts/                # Google Cloud Text-to-Speech audio streaming
│   │   │   └── user/sync/          # User routine cloud persistence endpoint
│   │   ├── community/              # Community evidence insights route (/community)
│   │   ├── dashboard/              # Routine tracking & metrics route (/dashboard)
│   │   ├── login/                  # Authentication sign-in route (/login)
│   │   ├── routine/                # Main daily routine route (/routine)
│   │   ├── signup/                 # Authentication registration route (/signup)
│   │   ├── layout.tsx              # Root server layout & font configuration
│   │   ├── page.tsx                # Public scientific landing page (/)
│   │   └── providers.tsx           # Client context providers
│   ├── components/                 # Reusable UI & domain components
│   │   ├── admin/                  # Policy ledger drawer & threshold inspector
│   │   ├── assistant/              # AI Paper Assistant sheet & hybrid badge tags
│   │   ├── community/              # Adherence & drop-off charts (Recharts SSR-safe)
│   │   ├── dashboard/              # Stat cards, photo comparisons & biomarker curves
│   │   ├── feedback/               # Error boundary, fallbacks, callouts
│   │   ├── layout/                 # Shell, sidebar, topbar, mobile nav
│   │   ├── routine/                # Set counters, calendar, voice coach, step rows, switchers
│   │   │   └── widgets/            # Polymorphic morphing widgets (scale, photo, numeric, timer, etc.)
│   │   └── ui/                     # Atomic design tokens (buttons, badges, icons, panels)
│   ├── contexts/                   # React Contexts (RoutineContext, AssistantState, Auth, PolicyLedger)
│   ├── data/                       # Centralized copy (copy.ts), config, and benchmark studies
│   ├── hooks/                      # Custom hooks (a11y, file drop, timers, voice, routine state)
│   ├── server/                     # Server-only logic (Gemini, Firestore ledger, routine registry, fallbacks)
│   ├── types/                      # Domain TypeScript interfaces (routine, auth, guardrails)
│   └── utils/                      # Safe math, metrics, time, and class utilities
├── next.config.mjs                 # Next.js standalone container configuration
├── tailwind.config.js              # Design system color & typography tokens
├── tsconfig.json                   # TypeScript path alias configuration
├── Dockerfile                      # Production multi-stage Docker build
└── AGENTS.md                       # Engineering rulebook & architectural guidelines
```

---

## Teammate Collaboration & Development Guidelines

Welcome to the team! Before pushing code, please review [`AGENTS.md`](./AGENTS.md):

1. **Verify Before Committing**:
   - Always run `npm run lint` and `npm run build` before pushing. Zero warnings and zero errors are required.
2. **Strict DRY & Centralized Copy**:
   - Modals and drawers must be mounted once in `AppShell.tsx` and controlled via shared Context.
   - All user-facing strings must be declared in [`src/data/copy.ts`](./src/data/copy.ts).
3. **Atomic Commit Slicing**:
   - Slice commits by layer: `feat(api): ...`, `feat(ui): ...`, `feat(copy): ...`, `fix(...): ...`.
4. **Zero Secrets on Client**:
   - Cloud keys and service account tokens must only reside in server route handlers (`src/app/api/...` or `src/server/...`).

---

## License

Private / Proprietary. Built for the Google AI Builder Cup.

