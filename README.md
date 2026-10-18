# ViskotuN1

An AI-powered digital experience transforming complex peer-reviewed research papers into executable, adaptive, and personalized health and rehabilitation routines.

Built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**, designed for deployment to **Google Cloud Run** and integration with **Gemini on Vertex AI**.

---

## Overview

Peer-reviewed clinical literature is notoriously dense and difficult for patients and athletes to follow safely. **ViskotuN1** bridges this gap by:
- **Multimodal Paper Ingestion & Gatekeeping**: Ingesting scientific PDFs and full-text links, isolating actionable methods, dosing, tempo, and contraindications while strictly rejecting non-human (animal/in-vitro) or non-interventional studies—complete with an interactive **Suitability Q&A** flow explaining why a declined paper is ineligible.
- **The "Morphing" Pipeline (Schema-Driven Adaptive UI & AI Widget Oversight)**: Dynamically generating bespoke data collection widgets and dashboard analytics tailored to the study's endpoints—spanning 6 core clinical primitives (`scale`, `photo`, `numeric`, `timer`, `multichoice`, `boolean`) plus **AI-Proposed Custom Widgets (`ProposedWidgetSpec`)** governed by a human-in-the-loop administrator approval queue.
- **Canonical Paper Registry & Semantic Protocol Versioning (`v1.0` → `v1.1`)**: Deduplicating papers by normalized DOI and title fingerprint so all participants tracking the same study share a single canonical protocol, pooling real-world efficacy telemetry, drop-off curves, and a public version changelog updated via AI-verified community corrections.
- **Live Routine Execution & Interactive Voice Coach**: Translating trial parameters into personalized daily routines with live set counters, tempo/hold pacing, guided audio coaching (`VoiceCoachBar` + Google Cloud TTS), and smart biofeedback scoring.
- **Adaptive Safety Lockouts**: Automatically pausing escalation and recommending load/dosage reductions when adverse symptom or tolerability thresholds are exceeded, governed by a live **Firestore Guardrail Policy Ledger**.
- **Grounded AI Paper Assistant**: Providing clinical Q&A grounded strictly in the study's *Methods and Interventions* section via a 3-tier hybrid AI cascade (On-Device Edge Gemma → Private Server Gemma → Cloud Gemini with multi-key 429 auto-failover).

---

## The "Morphing" Pipeline (Schema-Driven Adaptive UI & AI Widget Oversight)

A core innovation of ViskotuN1 is **Schema-Driven Adaptive UI** (Generative UI). Instead of forcing every clinical study into an identical generic slider or checkbox, the research paper dynamically constructs its own user interface—and can propose brand-new custom widgets when a study measures a specialized clinical endpoint:

```text
Research Paper (PDF / Full-Text Link)
      │
      ▼
[1. Extraction Layer — Gemini Multimodal]
  Analyzes "Methods" & "Outcomes" sections to isolate trial endpoints
  Outputs declarative `dataCollectionSpec` array alongside physical steps
      │
      ▼
[2. Validation & Oversight Layer — src/server/widgetRegistry.ts]
  • Standard Primitive? ➔ Mounts directly in <DynamicFieldRenderer />
  • Novel / Bespoke Endpoint? ➔ Registers `ProposedWidgetSpec` in Firestore
    (`collection: 'widget_proposals'`, status: 'pending_review')
    - While Pending: Renders safe fallback primitive + AI Oversight Banner
    - Admin Approved (`/api/admin/widgets`): Injects into canonical protocol
      and unlocks <CustomGeneratedWidget /> with custom presets & steppers
      │
      ▼
[3. Registry Layer — Polymorphic Component Factory]
  <DynamicFieldRenderer /> mounts exact matching UI primitives:
  • 'scale'       ➔ Severity-toned 0–10 visual analog slider (ScaleWidget)
  • 'photo'       ➔ Firebase Cloud Storage upload (`routines/photos/...`)
                    with offline data-URL fallback & alignment guide (PhotoWidget)
  • 'numeric'     ➔ Validated stepper with clinical units, e.g. mg/dL, mmHg (NumericWidget)
  • 'timer'       ➔ Dual-mode `stopwatch` or `countdown` timer (TimerWidget)
  • 'multichoice' ➔ Single-tap sticky clinical chip selectors (MultiChoiceWidget)
  • 'boolean'     ➔ Binary compliance & symptom check toggles (BooleanWidget)
  • 'approved'    ➔ Bespoke AI-proposed endpoint widget (CustomGeneratedWidget)
      │
      ▼
[4. Presentation Layer — Scheduling & Real-Data Morphing Dashboards]
  • Daily, Weekly, & Milestone Scheduling (e.g., photo check-ins on Day 1, 14, 30)
  • Morphing Dashboard Visualizers wired to live user `morphingLogs`:
    - Photos  ➔ Interactive Before / After split slider (<MilestonePhotoComparison />)
    - Numbers ➔ Biomarker trend curves with protocol-driven `targetMin` / `targetMax`
                healthy zone bands (<BiomarkerTrendChart />)
    - Scales  ➔ Tolerability and load escalation pause timelines (<ProgressionPanel />)
```

---

## Canonical Paper Registry, Semantic Versioning & Community Corrections

When multiple users upload or study the same peer-reviewed paper, ViskotuN1 prevents fragmented duplicate routines through a **Canonical Paper Registry** (`src/server/routineRegistry.ts`) paired with **Semantic Protocol Versioning**:

```text
User Uploads PDF or Pastes Paper URL
                 │
                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. Deterministic Paper Fingerprinting (src/utils/paperFingerprint.ts)       │
│  • Normalizes DOI and title slugs (`findCanonicalRoutine`)                  │
│  • Matches existing canonical entry OR stages a fresh candidate (`v1.0`)    │
│  • Candidate-First Isolation: Fresh extractions are only registered into    │
│    the shared catalog (`POST /api/papers`) after explicit user confirmation │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. Pooled Community Telemetry (`protocols/{canonicalId}`)                   │
│  • Aggregates real-world efficacy vs. published trial efficacy              │
│  • Tracks live active trackers, total logged sessions, and drop-off curves  │
│  • Pools verified participant reviews (`/api/community/reviews`)            │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. AI-Verified Community Corrections & Version Bumping (`v1.0` ➔ `v1.1`)   │
│  • Users or clinicians report a parameter discrepancy or propose an         │
│    improvement in the AI Paper Assistant chat                               │
│  • Assistant cross-checks the request against the study's Methods section   │
│  • If verified: Bumps protocol minor version (`updateCanonicalProtocolVersion`)│
│    and appends a `ProtocolChangelogEntry` (`addedFields`, `updatedFields`)  │
│  • Inspectable anytime via version pills (`v1.0`) & <VersionHistoryModal /> │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hybrid AI Architecture: Cloud Gemini + Edge Gemma

ViskotuN1 employs a **Hybrid AI Tiering** model designed to optimize cost, resilience, latency, and patient privacy:

```text
                                  User Action
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
[PDF Ingestion & Schema Extraction]                       [Daily Adherence & Policy Q&A]
                │                                                     │
                ▼                                                     ▼
  Gemini Flash Pool (Cloud Failover)                    4-Path Intelligent Cascade:
  • Multi-key round-robin rotation                      1. Edge Gemma (window.ai)
  • Automatic HTTP 429 quota failover                     • 100% on-device (Chrome AI)
  • Ingests full-text clinical papers                     • $0 API cost, 0ms latency
  • Generates `dataCollectionSpec` &                      • Complete medical data privacy
    `proposedWidget` specs                              2. Private Server Gemma
                                                          • Ollama / Vertex Model Garden
                                                        3. Cloud Gemini Flash (Multi-Key)
                                                          • High-reasoning fallback &
                                                            protocol discrepancy verification
                                                        4. Deterministic Rule & Rejection Matcher
                                                          • Offline citation & Gatekeeper
                                                            rejection suitability Q&A
```

1. **Cloud Tier with Multi-Key Failover (`src/server/geminiKeys.ts`)**: Handles multimodal document extraction and complex clinical cross-checking. Supports comma-separated API key pools (`GEMINI_API_KEYS`) with automatic round-robin rotation and instant failover on HTTP 429 rate limits.
2. **Edge Tier (`src/utils/edgeGemma.ts`)**: Handles repetitive daily routine Q&A through Chrome Built-in AI (`window.ai`). Patient health queries never leave the device.
3. **Private Server Tier (`GEMMA_ENDPOINT_URL`)**: Supports connecting private self-hosted Gemma 2 instances via Ollama or Google Vertex AI Model Garden.
4. **Gatekeeper Rejection Suitability Q&A (`src/utils/rejectionAssistant.ts`)**: When the Gatekeeper declines a non-human (e.g., rodent/in-vitro) or non-interventional paper, the declined paper remains in the Add-Paper chat context so users can ask *why* it was rejected and what human trials qualify—while strictly blocking hallucinated routines from non-human data.

---

## Dynamic Guardrail Policy Ledger & Widget Oversight (Google Cloud Firestore)

In safety-critical clinical and health applications, hardcoded thresholds in code are insufficient when medical advisory guidelines update or when AI proposes novel UI widgets. ViskotuN1 features a **Dynamic Guardrail Policy Ledger** backed by **Google Cloud Firestore**:

```text
                         ┌─────────────────────────────────────┐
                         │ Google Cloud Firestore              │
                         │ • policies/clinical_guardrails      │
                         │ • widget_proposals/{proposalId}     │
                         └──────────────────┬──────────────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Next.js Server Governance Layer (guardrailLedger.ts & widgetRegistry.ts)    │
│  • Hot memory cache (1-min TTL) for sub-millisecond request resolution      │
│  • Automatic fail-safe fallback to baseline standards if offline/unconfigured│
│  • Injects dynamic gatekeeper criteria & adverse thresholds into Gemini     │
└──────────────┬──────────────────────────────────────────────────────────────┘
               │
       ┌───────┴───────────────────────────────┐
       ▼                                       ▼
┌───────────────────────────────┐  ┌───────────────────────────────────────────┐
│ /api/extract & /api/assistant │  │ /api/admin/guardrails & /api/admin/widgets│
│ Dynamic gatekeeping, adverse  │  │ • Live ledger health & active policy      │
│ threshold injection & widget  │  │ • Zero-downtime threshold tuning          │
│ proposal registration         │  │ • 1-click approval of AI-proposed widgets │
└───────────────────────────────┘  └───────────────────────────────────────────┘
```

- **Zero-Downtime Policy Tuning**: Clinical administrators can update adverse escalation thresholds, load reduction percentages, and gatekeeper banned keywords on the fly without rebuilding or redeploying containers.
- **Human-in-the-Loop AI Widget Approval**: Administrators review pending `ProposedWidgetSpec` items in the **Policy Ledger Drawer** and approve them with one click, immediately upgrading the protocol's UI across sessions.
- **Admin Simulation & Testing Controls**: Built-in testing controls allow simulating multi-day adherence (`simulatePastDays`), full protocol completion (`simulateFullCompletion`), and local midnight day rollovers.
- **Interactive UI Inspector**: Tap the **Shield** icon in the TopBar to inspect live policy provenance, view Firestore connectivity status, approve pending AI widgets, and test dynamic policy updates in real time.

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
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS, CSS variables with alpha-channel support
- **UI & Animation**: Framer Motion, Material UI Icons (`@mui/icons-material`)
- **Data Visualization**: Recharts (with SSR-safe client-side dynamic rendering)
- **Notifications**: Sonner
- **Persistence & Storage**: Google Cloud Firestore & Firebase Cloud Storage (with hot in-memory and local storage fallbacks)
- **AI & Cloud Backend**: Gemini on Vertex AI / Google AI Studio, Google Cloud Text-to-Speech (`/api/tts`), and Google Cloud Run (`output: 'standalone'`)

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

### Production Build & Verification

Create an optimized standalone production build and run tests:

```bash
npm run lint
npm run build
npm test
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
  --set-env-vars GEMINI_API_KEYS="key1,key2",NODE_ENV="production"
```

#### 2. Local Container Build & Verification
You can build and test the container image locally with Docker:

```bash
# Build the production image
docker build -t viskotun1:latest .

# Run container locally on port 3000
docker run -p 3000:3000 -e GEMINI_API_KEYS="your-gemini-api-key" viskotun1:latest
```

---

### Environment Variables

Copy `.env.example` to `.env.local` to configure your local development environment:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
| :--- | :--- | :--- |
| `GEMINI_API_KEYS` | Recommended | Comma-separated list of Gemini API keys for automatic round-robin rotation and HTTP 429 quota failover. |
| `GEMINI_API_KEY` | Optional | Single Gemini API key fallback if `GEMINI_API_KEYS` is not set. If omitted, pre-calibrated offline routines are used. |
| `GEMINI_MODEL` | Optional | Gemini model identifier (default: `gemini-3.8-flash` / `gemini-3.1-flash-lite`). |
| `GOOGLE_CLOUD_PROJECT` | Optional | Google Cloud Project ID for Cloud Run deployment and Firestore integration. |
| `FIRESTORE_DATABASE_ID` | Optional | Dedicated Firestore database ID (default: `viskotun1-database`). |
| `NEXT_PUBLIC_FIREBASE_*` | Optional | Firebase Web Client SDK parameters for live Google OAuth, Email auth, and Cloud Storage photo uploads (`STORAGE_BUCKET`). |
| `GEMMA_ENDPOINT_URL` | Optional | URL to a self-hosted Gemma 2 instance (e.g. Ollama or Vertex AI Model Garden). |
| `GEMMA_MODEL` | Optional | Model identifier for the private Gemma endpoint (default: `gemma2:2b`). |

---

## Project Structure

```text
├── src/
│   ├── app/                        # Next.js 14 App Router
│   │   ├── api/                    # Server Route Handlers
│   │   │   ├── admin/
│   │   │   │   ├── guardrails/     # Dynamic Firestore policy ledger API
│   │   │   │   └── widgets/        # AI-proposed custom widget oversight & approval API
│   │   │   ├── assistant/          # Hybrid AI Q&A, rejection suitability & version correction API
│   │   │   ├── community/
│   │   │   │   ├── metrics/        # Live pooled efficacy & tracker telemetry API
│   │   │   │   └── reviews/        # Canonical paper community reviews API
│   │   │   ├── extract/            # Multimodal PDF & full-text extraction endpoint
│   │   │   ├── papers/             # Canonical paper confirmation & trending catalog API
│   │   │   ├── tts/                # Google Cloud Text-to-Speech audio streaming
│   │   │   └── user/sync/          # User routine cloud persistence endpoint
│   │   ├── community/              # Community evidence insights & explore route (/community)
│   │   ├── dashboard/              # Routine tracking & morphing metrics route (/dashboard)
│   │   ├── login/                  # Authentication sign-in route (/login)
│   │   ├── routine/                # Main daily routine route (/routine)
│   │   ├── signup/                 # Authentication registration route (/signup)
│   │   ├── layout.tsx              # Root server layout & font configuration
│   │   ├── page.tsx                # Public scientific landing page (/)
│   │   └── providers.tsx           # Client context providers
│   ├── components/                 # Reusable UI & domain components
│   │   ├── admin/                  # Policy ledger drawer, threshold inspector & widget approval queue
│   │   ├── assistant/              # AI Paper Assistant sheet, candidate cards & hybrid badge tags
│   │   ├── community/              # Efficacy cards, drop-off charts, trending cards & VersionHistoryModal
│   │   ├── dashboard/              # Stat cards, MilestonePhotoComparison, BiomarkerTrendChart & physician summary
│   │   ├── feedback/               # Error boundary, fallbacks, callouts
│   │   ├── layout/                 # Shell, sidebar, topbar, mobile nav
│   │   ├── routine/                # Set counters, calendar, VoiceCoachBar, DynamicFieldRenderer, switchers
│   │   │   └── widgets/            # Polymorphic morphing widgets (Scale, Photo, Numeric, Timer, MultiChoice, Boolean, CustomGenerated)
│   │   └── ui/                     # Atomic design tokens (buttons, badges, icons, panels)
│   ├── contexts/                   # React Contexts (RoutineContext, AssistantContext, AuthContext, PolicyLedgerContext)
│   ├── data/                       # Centralized copy (copy.ts), config, calibrated routines & benchmark studies
│   ├── hooks/                      # Custom hooks (a11y, file drop, timers, voice coach, routine state)
│   ├── lib/                        # Firebase client & Cloud Storage singletons (firebase.ts)
│   ├── server/                     # Server-only logic (Gemini extraction, multi-key failover, Firestore ledger, canonical routine registry, widget registry)
│   ├── types/                      # Domain TypeScript interfaces (routine, auth, guardrails)
│   └── utils/                      # Paper fingerprinting, routine metrics, rejection assistant, voice, time & math utilities
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
   - Slice commits by layer: `feat(api): ...`, `feat(ui): ...`, `feat(copy): ...`, `fix(...): ...`, `docs(...): ...`.
4. **Zero Secrets on Client**:
   - Cloud keys and service account tokens must only reside in server route handlers (`src/app/api/...` or `src/server/...`).

---

## License

Private / Proprietary. Built for the Google AI Builder Cup.

