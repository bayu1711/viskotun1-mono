# TrialN1

An AI-powered digital experience transforming complex peer-reviewed research papers into executable, adaptive, and personalized health and rehabilitation routines.

Built with **Next.js 14 (App Router)**, **TypeScript**, and **Tailwind CSS**, designed for deployment to **Google Cloud Run** and integration with **Gemini on Vertex AI**.

---

## Overview

Peer-reviewed clinical literature is notoriously dense and difficult for patients and athletes to follow safely. **TrialN1** bridges this gap by:
- **Multimodal Paper Ingestion & Gatekeeping**: Ingesting scientific PDFs and full-text links, isolating actionable methods, dosing, tempo, and contraindications while strictly rejecting non-human (animal/in-vitro) or non-interventional studies—complete with an interactive **Suitability Q&A** flow explaining why a declined paper is ineligible.
- **The "Morphing" Pipeline (Schema-Driven Adaptive UI & AI Widget Oversight)**: Dynamically generating bespoke data collection widgets and dashboard analytics tailored to the study's endpoints—spanning 6 core clinical primitives (`scale`, `photo`, `numeric`, `timer`, `multichoice`, `boolean`) plus **AI-Proposed Custom Widgets (`ProposedWidgetSpec`)** governed by a human-in-the-loop administrator approval queue.
- **Canonical Paper Registry & Semantic Routine Versioning (`v1.0` → `v1.1`)**: Deduplicating papers by normalized DOI and title fingerprint so all participants tracking the same study share a single canonical routine, pooling real-world efficacy telemetry, drop-off curves, and a public version changelog updated via AI-verified community corrections.
- **Live Routine Execution, Dose Modes & Interactive Voice Coach**: Translating trial parameters into personalized daily routines with live set counters, tempo/hold pacing, **Dose Mode** switching (`Standard` vs low-friction `Micro`), guided audio coaching (`VoiceCoachBar` + Google Cloud TTS), and smart biofeedback scoring.
- **Global Adaptive Lifestyle Engine & Multicultural Interview**: Adapting schedules safely to each participant's city/climate, age, multi-select daily availability windows, physical cautions, and country-independent **Cultural & Household Rhythms** (`CulturalRhythmId` — Ramadan/intermittent/periodic fasting, late family dinners, early dawn rising, midday rest, Sabbath/weekly rest, and shared households) without stereotyping by location.
- **Biological Health Age & Accredited Habit Science (BCT)**: Computing personalized **Biological Health Age** projections (`src/utils/healthAgeEngine.ts`) from chronological age, streak, and adherence, backed by an inspectable **Behavior Change Technique (BCT)** taxonomy in the **How-To Guide** and **BCT Ledger Drawer**.
- **Routine Sharing, Calendar Export & Profile Controls**: Exporting daily adherence schedules to Google Calendar / `.ics` (RFC 5545), sharing QR-linked study summaries, and managing identity, clinical focus, data export, and account deletion under `/profile` (**Lifestyle** + **Data & Account Controls**).
- **Adaptive Safety Lockouts**: Automatically pausing escalation and recommending load/dosage reductions when adverse symptom or tolerability thresholds are exceeded, governed by a live **Firestore Guardrail Policy Ledger**.
- **Grounded AI Paper Assistant & Paper Discovery**: Providing clinical Q&A grounded strictly in the study's *Methods and Interventions* section via a 4-path hybrid AI cascade with per-key timeouts and HTTP 429 failover, plus live keyword search (`/api/papers/search`) and interactive guidance cards (`PaperGuidanceCard`).
- **Full English & RTL Arabic Localization (`/uae` Edition)**: Switching seamlessly between English and full RTL Arabic across the entire workspace, paired with the dedicated **Abu Dhabi & UAE Future Health Challenge 09** showcase at `/uae`.

---

## The "Morphing" Pipeline (Schema-Driven Adaptive UI & AI Widget Oversight)

A core innovation of TrialN1 is **Schema-Driven Adaptive UI** (Generative UI). Instead of forcing every clinical study into an identical generic slider or checkbox, the research paper dynamically constructs its own user interface—and can propose brand-new custom widgets when a study measures a specialized clinical endpoint:

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
    - Admin Approved (`/api/admin/widgets`): Injects into canonical routine
      and unlocks <CustomGeneratedWidget /> with custom presets & steppers
      │
      ▼
[3. Registry Layer — Polymorphic Component Factory]
  <DynamicFieldRenderer /> mounts exact matching UI primitives:
  • 'scale'       ➔ Severity-toned 0–10 visual analog slider (ScaleWidget)
  • 'photo'       ➔ Google Cloud Storage upload (`/api/upload` & `/api/media/...`)
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
    - Numbers ➔ Biomarker trend curves with routine-driven `targetMin` / `targetMax`
                healthy zone bands (<BiomarkerTrendChart />)
    - Scales  ➔ Tolerability and load escalation pause timelines (<ProgressionPanel />)
```

---

## Canonical Paper Registry, Semantic Versioning & Community Corrections

When multiple users upload or study the same peer-reviewed paper, TrialN1 prevents fragmented duplicate routines through a **Canonical Paper Registry** (`src/server/routineRegistry.ts`) paired with **Semantic Routine Versioning**:

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
│ 2. Pooled Community Telemetry (`routines/{canonicalId}`)                    │
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
│  • If verified: Bumps routine minor version (`updateCanonicalRoutineVersion`)│
│    and appends a `RoutineChangelogEntry` (`addedFields`, `updatedFields`)   │
│  • Inspectable anytime via version pills (`v1.0`) & <VersionHistoryModal /> │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Hybrid AI Architecture: Cloud Gemini + Edge Gemma

TrialN1 employs a **Hybrid AI Tiering** model designed to optimize cost, resilience, latency, and patient privacy:

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
                                                            routine discrepancy verification
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

In safety-critical clinical and health applications, hardcoded thresholds in code are insufficient when medical advisory guidelines update or when AI proposes novel UI widgets. TrialN1 features a **Dynamic Guardrail Policy Ledger** backed by **Google Cloud Firestore**:

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
- **Human-in-the-Loop AI Widget Approval**: Administrators review pending `ProposedWidgetSpec` items in the **Policy Ledger Drawer** and approve them with one click, immediately upgrading the routine's UI across sessions.
- **Admin Simulation & Testing Controls**: Built-in testing controls allow simulating multi-day adherence (`simulatePastDays`), full routine completion (`simulateFullCompletion`), and local midnight day rollovers.
- **Interactive UI Inspector**: Tap the **Shield** icon in the TopBar to inspect live policy provenance, view Firestore connectivity status, approve pending AI widgets, and test dynamic policy updates in real time.

---

## Zero-Hallucination Parameter Resolution (3-Tier Clinical Pipeline)

When academic papers describe interventions in their Methods section, authors frequently omit minor execution parameters (e.g., stating *"participants performed static stretching"* without publishing hold duration or sets). Rather than silently hallucinating numbers or breaking routine execution, TrialN1 executes a deterministic **3-Tier Resolution Pipeline**:

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

## Global Adaptive Lifestyle Profile & Multicultural Personalization

Instead of forcing one generic schedule or assuming cultural habits from a user's country, TrialN1 separates **geography/environment** from **culture, availability, and clinical physiology**:

- **Conversational 5-Stage Adaptive Interview (`LifestyleTuningView` & `src/utils/lifestyleInterview.ts`)**: Auto-opens inside the workspace for newly registered/un-onboarded users (staying silent on public landing/auth routes) and walks through 5 lightweight chat stages—**Region & Environment** (`/api/geo`) → **Age** → **Multi-Select Availability Windows** (`AvailableWindowsEditor`) → **Work & Multicultural Rhythms** → **Physical Cautions**—displaying live context chips, routine-change summary chips, and supporting post-onboarding natural-language or imperative updates via `POST /api/lifestyle/tune`.
- **Country-Independent Cultural & Household Rhythms (`CulturalRhythmId`)**: Supports `ramadan_fasting`, `intermittent_fasting`, `periodic_religious_fasting`, `late_family_dinner`, `early_dawn_riser`, `midday_siesta_rest`, `sabbath_weekly_rest`, and `collectivist_household` anywhere in the world—adapting daily availability chips, AI context suggestions, and step timing tips without geographic stereotyping.
- **Schedule Compatibility & Guardrail-Protected Adaptation (`AdaptiveLifestyleModal` & `src/server/lifestyleGuardrails.ts`)**: `POST /api/lifestyle/adapt` produces a `LifestyleAdaptationSpec` rendered in `AdaptiveLifestyleBanner` and `AdaptiveLifestyleModal`, where users can switch between `anytime`, `profile_windows`, and per-routine `custom_windows` (`evaluateRoutineScheduleCompatibility`). Safety guardrails block load/dose inflation, validate step IDs, and recommend `micro` / `rest` pacing (`DoseModeModal`) when compounding friction exists.
- **Profile & Account Hub (`/profile`)**: Accessible from the header avatar with **Lifestyle** (`UserProfile` + `UserLifestyleProfile` + auto-derived Clinical Focus) and **Data & Account Controls** (`AccountControlsPanel` + `/api/user/account` JSON export, session management, and account deletion).

---

## Tech Stack

- **Framework**: Next.js 14 (App Router, Server & Client Components)
- **Language**: TypeScript (Strict mode)
- **Styling & Localization**: Tailwind CSS with CSS-variable design tokens, full English + RTL Arabic support (`src/data/locales/ar.ts`)
- **UI & Animation**: Framer Motion, Material UI Icons (`@mui/icons-material`), `qrcode` (QR sharing)
- **Data Visualization**: Recharts (SSR-safe dynamic client-only rendering)
- **Notifications**: Sonner
- **Testing & Quality**: Vitest (`49` test files, `380` unit tests), ESLint (`next lint`)
- **Persistence & Storage**: Google Cloud Firestore & Google Cloud Storage (with proxy streaming `/api/media/[...path]`, private bucket security, and local file fallbacks)
- **AI & Cloud Backend**: Gemini on Vertex AI / Google AI Studio (per-key timeout + HTTP 429 multi-key failover), Google Cloud Text-to-Speech (`/api/tts`), and Google Cloud Run (`output: 'standalone'`)

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

Run the development server locally on port `3010` (uses `.next-dev` to keep dev assets isolated from production `.next`):

```bash
npm run dev
```

Open [http://localhost:3010](http://localhost:3010) in your browser.

### Lightweight Verification & Release Build

During iterative development, run lightweight checks (per `AGENTS.md`, full `npm run build` is reserved for manual release checks rather than every task iteration):

```bash
npm run lint
npm test
```

For full standalone production container or release verification:

```bash
npm run build
npm run start
```

---

## Testing & Authentication Modes Guide

TrialN1 offers multiple authentication and testing pathways designed for evaluators, clinical researchers, patients, and administrators. You can test each tier without needing pre-existing credentials.

### Authentication Pathways

1. **Guest Mode (Quick Test / Anonymous Explorer)**
   - **How to test**: Navigate to `/login` or `/signup` and click **"Continue as guest"** (or browse directly without logging in).
   - **Persistence**: Fast client-side `localStorage` caching. Perfect for quick UI/UX reviews and offline exploration.
   - **Badge**: Shows a *"Sign in to sync"* prompt in the top navigation bar.

2. **Standard Email / Password (Normal Login & Registration)**
   - **How to test**:
     - Navigate to `/signup` to register a new account (Name, Email, Password with at least 6 characters) or `/login` to sign in.
     - Any standard email (e.g. `patient@example.com`, `clinician@hospital.org`) creates an authenticated clinical user account.
   - **Persistence**: Synchronized with Firebase Auth and the cloud user persistence endpoint (`/api/user/sync`).

3. **Google Authentication (OAuth Sign-In)**
   - **How to test**:
     - Navigate to `/login` or `/signup` and click **"Continue with Google"**.
     - Sign in using any Google account via the Firebase OAuth popup modal.
   - **Persistence**: Full cloud synchronization via Firebase Client SDK and Google OAuth profile.

4. **Admin Role (Clinical Lead & System Administration)**
   - **How to test**:
     - **1-Click Quick Access**: On `/login` or `/signup`, click the **"Continue as Admin"** button (`Dr. Evelyn Reed`).
     - **Email Keyword**: Sign up or log in using any email containing `admin` (e.g. `admin@viskotun1.internal`, `admin@example.com`).
   - **Badge**: Shows the green active dot with the `admin` badge in the top navigation bar.
   - **Unlocked Features**: Activates the Guardrail Policy Ledger drawer, AI-proposed widget approval queue, fast-forward routine day simulations, and one-click demo reset.
   - **Post-Competition Security**: *Following the completion of the Google AI Builder Cup evaluation, public admin entry points and one-click tester buttons will be sealed off and restricted strictly behind internal clinical staff credentials and enterprise IAM governance.*

---

### Feature Matrix by Authentication Mode

| Feature / Capability | Guest Explorer | Normal User (Email) | Google Auth | Admin (Clinical Lead) | How to Access & Test |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Daily Routine Execution** | ✅ | ✅ | ✅ | ✅ | Navigate to `/routine`; test set counters, hold timers, and completion toggles |
| **Interactive Voice Coach** | ✅ | ✅ | ✅ | ✅ | Tap *"Voice Coach"* bar at the bottom of `/routine`; tests Google Cloud TTS (`/api/tts`) with fallback |
| **Biofeedback & Dynamic Logging** | ✅ | ✅ | ✅ | ✅ | Tap *"Log Discomfort"* or complete steps to submit scale (0–10), numeric, or boolean scores |
| **Multimodal Paper Ingestion** | ✅ | ✅ | ✅ | ✅ | Tap `+` button in top bar or drop PDF into `/routine`; tests Gemini extraction & gatekeeping |
| **Suitability Q&A Flow** | ✅ | ✅ | ✅ | ✅ | Upload an ineligible paper (e.g. animal/in-vitro) to trigger interactive rejection explanation |
| **Grounded AI Clinical Assistant** | ✅ | ✅ | ✅ | ✅ | Open Assistant sheet; ask questions grounded strictly in paper's Methods section |
| **Routine Switcher & Dose Modes** | ✅ | ✅ | ✅ | ✅ | Switch between pre-loaded studies or toggle `Standard` / `Micro` dose modes in `/routine` |
| **Adaptive Lifestyle Profile & Interview** | ✅ | ✅ | ✅ | ✅ | Auto-opens guided Q&A for new workspace users or via **Lifestyle** button on `/routine` |
| **Profile & Data Controls** | Partial (Local) | ✅ | ✅ | ✅ | Click header avatar → `/profile` (**Lifestyle** & **Data & Account Controls** tabs, JSON export/delete) |
| **Routine Sharing & Calendar Export** | ✅ | ✅ | ✅ | ✅ | Click Share icon on `/routine` for QR code links, `.ics` download, or Google Calendar event |
| **Habit Science & How-To Guide** | ✅ | ✅ | ✅ | ✅ | Open How-To modal (**Habit Science** tab) or inspect live BCT principles across the UI |
| **Biological Health Age & Morphing Dashboard** | ✅ | ✅ | ✅ | ✅ | Navigate to `/dashboard`; view age-calibrated Health Age, photo sliders & biomarker trends |
| **Community Evidence & Reviews** | ✅ | ✅ | ✅ | ✅ | Navigate to `/community`; view pooled drop-off curves, efficacy scores, and public version history |
| **Cross-Device Cloud Sync** | ❌ (Local only) | ✅ | ✅ | ✅ | State synced to Firebase & `/api/user/sync`; preserves streak and lifestyle profile across devices |
| **Cloud Storage Photo Uploads** | Fallback (Data URL) | ✅ (GCS Bucket) | ✅ (GCS Bucket) | ✅ (GCS Bucket) | Complete a photo check-in step; tests `/api/upload` and `/api/media/...` streaming |
| **Fast-Forward Routine Simulation** | ❌ | ❌ | ❌ | ✅ **(Admin Only)** | Under *"Today's Progress"*: test *"Advance to Next Day"*, *"Simulate +4 Days"*, & *"Simulate Full Completion"* |
| **Dynamic Guardrail Policy Ledger** | ❌ | ❌ | ❌ | ✅ **(Admin Only)** | Click Shield icon in TopBar; adjust pain lockout threshold slider & load reduction % |
| **AI Widget Approval Queue** | ❌ | ❌ | ❌ | ✅ **(Admin Only)** | Open Policy Ledger drawer; review & approve pending Gemini-extracted `ProposedWidgetSpec` |
| **One-Click Demo Reset** | ❌ | ❌ | ❌ | ✅ **(Admin Only)** | Click Restart icon in TopBar; resets routine, telemetry, and routines to default state |

> [!NOTE]
> **Admin Panel Lifecycle & Post-Competition Sealing**: The 1-click admin sign-in, Policy Ledger drawer, AI-proposed widget approval queue, and fast-forward routine simulation controls are temporarily surfaced in the public UI exclusively to facilitate evaluation and technical grading for the **Google AI Builder Cup**. Once the competition concludes, the entire admin panel will be sealed off and placed behind private multi-factor authentication (MFA) and Google Cloud IAM role restrictions.

---

### Google Cloud Run Deployment

TrialN1 uses Next.js 14 `output: 'standalone'` and a multi-stage Dockerfile producing a minimal (<150MB) production container image.

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
│   │   │   ├── geo/                # Global ISO-3166 region & timezone auto-detection API
│   │   │   ├── lifestyle/
│   │   │   │   ├── adapt/          # Guardrail-protected LifestyleAdaptationSpec engine API
│   │   │   │   └── tune/           # Multicultural suggestion & semantic lifestyle intent API
│   │   │   ├── media/[...path]/    # Authenticated proxy streaming for uploaded GCS images
│   │   │   ├── papers/
│   │   │   │   ├── route.ts        # Canonical paper confirmation & trending catalog API
│   │   │   │   └── search/         # Literature keyword search API for PaperGuidanceCard
│   │   │   ├── tts/                # Google Cloud Text-to-Speech audio streaming
│   │   │   ├── upload/             # Cloud Storage upload endpoint with offline fallback
│   │   │   └── user/
│   │   │       ├── account/        # User data JSON export & account deletion API
│   │   │       └── sync/           # User routine & profile cloud persistence endpoint
│   │   ├── community/              # Community evidence insights & explore route (/community)
│   │   ├── dashboard/              # Routine tracking, Health Age & morphing metrics (/dashboard)
│   │   ├── login/                  # Authentication sign-in route (/login)
│   │   ├── profile/                # Lifestyle & Data/Account Controls hub (/profile)
│   │   ├── routine/                # Main daily routine execution route (/routine)
│   │   ├── signup/                 # Authentication registration route (/signup)
│   │   ├── uae/                    # Dedicated Abu Dhabi & UAE Challenge 09 landing (/uae)
│   │   ├── layout.tsx              # Root server layout & font configuration
│   │   ├── page.tsx                # Public global scientific landing page (/)
│   │   └── providers.tsx           # Client context providers
│   ├── components/                 # Reusable UI & domain components
│   │   ├── admin/                  # Policy ledger drawer, threshold inspector & widget approval queue
│   │   ├── assistant/              # AI Paper Assistant sheet, LifestyleTuningView, PaperGuidanceCard & hybrid chips
│   │   ├── bct/                    # Behavior Change Technique inspector drawer (`BctLedgerDrawer`)
│   │   ├── community/              # Efficacy cards, drop-off charts, trending cards & VersionHistoryModal
│   │   ├── dashboard/              # Stat cards, HealthAgeCard, MilestonePhotoComparison, BiomarkerTrendChart & physician summary
│   │   ├── feedback/               # Error boundary, fallbacks, callouts
│   │   ├── howto/                  # Interactive walkthrough & Habit Science tabs (`HowToModal`)
│   │   ├── layout/                 # Shell, sidebar, topbar, LanguageSwitcher, mobile nav
│   │   ├── profile/                # Account data export & deletion panel (`AccountControlsPanel`)
│   │   ├── routine/                # Set counters, calendar, VoiceCoachBar, ShareRoutineModal, DoseModeModal, AdaptiveLifestyleModal, DynamicFieldRenderer
│   │   │   └── widgets/            # Polymorphic morphing widgets (Scale, Photo, Numeric, Timer, MultiChoice, Boolean, CustomGenerated)
│   │   └── ui/                     # Atomic design tokens (AvailableWindowsEditor, buttons, badges, icons, panels)
│   ├── contexts/                   # React Contexts (RoutineContext, AssistantContext, AuthContext, LocaleContext, PolicyLedgerContext)
│   ├── data/                       # Centralized EN copy (copy.ts), RTL Arabic locales (locales/ar.ts), calibrated routines & BCT taxonomy
│   ├── hooks/                      # Custom hooks (a11y, file drop, timers, voice coach, routine state)
│   ├── lib/                        # Firebase client & Cloud Storage singletons (firebase.ts)
│   ├── server/                     # Server-only logic (Gemini extraction, multi-key failover, lifestyleEngine, lifestyleGuardrails, regionalRegistry, Firestore ledger, canonical routine registry, widget registry)
│   ├── types/                      # Domain TypeScript interfaces (routine, auth, bct, guardrails, schedule)
│   └── utils/                      # Paper fingerprinting, lifestyleInterview, healthAgeEngine, calendar (.ics), sharing, profile, voice & routine metrics
├── next.config.mjs                 # Next.js standalone container configuration
├── tailwind.config.js              # Design system color & typography tokens
├── tsconfig.json                   # TypeScript path alias configuration
├── Dockerfile                      # Production multi-stage Docker build
├── AI Builder Cup - Viskotu.pdf    # Official Google AI Builder Cup presentation & submission deck
└── AGENTS.md                       # Engineering rulebook & architectural guidelines
```

---

## Teammate Collaboration & Development Workflow

Welcome to the team! Before committing or pushing code, please review [`AGENTS.md`](./AGENTS.md):

1. **Git Branching & Release Policy (Never Push Directly to `main`)**:
   - **`main` is reserved strictly for production releases** and must **never** be pushed to directly during feature work or automated commits.
   - Conduct active work directly in `viskotun1` on feature branches or merged into **`dev_staging`** (`git push origin dev_staging`), then promote `dev_staging` → `main` via Pull Request.
   - There is no separate sandbox worktree; all development runs cleanly inside `viskotun1`.
2. **Lightweight Verification During Iteration**:
   - Run `npm run lint` and targeted `npm test` suites during feature iterations (`npx tsc --noEmit` + full `npm test` cleanly verifies types and all 49 suites).
   - Do **not** run automatic full `npm run build` on every intermediate edit—reserve full production builds for manual release checks.
3. **Strict DRY & Centralized Bilingual Copy**:
   - Mount shared modals and drawers **once** in `AppShell.tsx` and control them via shared Context.
   - Declare all user-facing English strings in [`src/data/copy.ts`](./src/data/copy.ts) and mirror Arabic translations in [`src/data/locales/ar.ts`](./src/data/locales/ar.ts).
4. **Atomic Commit Slicing**:
   - Slice commits cleanly by architectural layer: `feat(types): ...`, `feat(copy): ...`, `feat(server): ...`, `feat(api): ...`, `feat(ui): ...`, `test(...): ...`, `docs(...): ...`.
5. **Zero Secrets on Client**:
   - Cloud keys, Gemini API key pools, and service account tokens must only reside in server route handlers (`src/app/api/...` or `src/server/...`).

---

## Submission & License

- **Google AI Builder Cup Presentation**: [`AI Builder Cup - Viskotu.pdf`](./AI%20Builder%20Cup%20-%20Viskotu.pdf)
- **License**: Private / Proprietary. Built for the Google AI Builder Cup.

