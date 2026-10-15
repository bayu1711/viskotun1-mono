# Architectural Plan: The "Morphing" Pipeline (Schema-Driven Adaptive UI)

> **Document Version**: 1.0.0  
> **Target Project**: Protocol Engine — Google AI Builder Cup (*Media, Content & Digital Experiences*)  
> **Objective**: Transform Protocol Engine from a static 0–10 pain logging app into a **Universal Clinical Trial Engine** where the ingested research paper dynamically generates its own logging widgets, milestone schedules, and dashboard visualizers.

---

## 1. Executive Summary & Problem Statement

### The Problem
Traditional health and clinical adherence applications force every research study into a rigid, one-size-fits-all template (typically a generic checkbox and a 0–10 numeric slider). In actual clinical science, this assumption fails immediately:
- An **orthopedic rehabilitation trial** (e.g., Achilles tendinopathy) measures **pain scale (VAS 0–10)** and **joint range of motion (degrees)**.
- A **dermatology or wound-healing trial** requires **standardized clinical photographs** captured at specific milestones (Baseline, Day 14, Day 30).
- A **metabolic or intermittent fasting trial** tracks **fasting blood glucose (mg/dL)**, **ketone levels (mmol/L)**, and **eating window timestamps**.
- A **neurological or cognitive study** measures **reaction time (milliseconds)** or **timed functional tests** (e.g., 30-second sit-to-stand).

### The Solution: The "Morphing" Pipeline
Protocol Engine introduces a **Schema-Driven Adaptive UI** (Generative UI):
1. **Gemini** reads the trial's *Methods*, *Outcomes*, and *Data Collection* sections to isolate the exact study endpoints.
2. Gemini outputs a declarative **`dataCollectionSpec`** alongside the daily physical steps.
3. The frontend **Component Factory** dynamically mounts the exact UI widgets required by the paper (e.g., photo capture, biomarker steppers, multi-choice chips).
4. The **Dashboard visualizers morph** to match the data type (photo comparison slider, biometric trend lines, or tolerability progression heatmaps).

---

## 2. System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        Research Paper (PDF)                            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 1: Extraction & Schema Generation                   │
│ • Gemini analyzes "Outcomes & Measurements" section                     │
│ • Extracts structured `dataCollectionSpec` array                       │
│ • Defines widget types, units, ranges, and milestone schedules         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 2: Polymorphic Component Factory                    │
│ • <DynamicFieldRenderer /> inspects field `type`                       │
│ • Mounts registered primitives:                                        │
│   ├─ 'scale'       ➔ Severity-toned 0–10 Slider                        │
│   ├─ 'photo'       ➔ Camera capture with alignment guidance overlay    │
│   ├─ 'numeric'     ➔ Unit-bounded biomarker stepper (e.g. mg/dL)       │
│   ├─ 'timer'       ➔ Embedded countdown / functional test stopwatch    │
│   └─ 'multichoice' ➔ Single-tap clinical chip selector                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│               TIER 3: Presentation & Adaptive Outcomes                 │
│ • Milestone Awareness: Lean daily check-in vs. Milestone Day card       │
│ • Morphing Dashboard Visualizations:                                   │
│   ├─ Photo Data    ➔ Before/After Split Comparison Slider              │
│   ├─ Biomarker Data➔ Clinical Trend Curve with Target Normal Zones     │
│   └─ Scale Data    ➔ Tolerability Progression Curve & Pauses           │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Contracts & TypeScript Schema

### A. Data Collection Specification
```typescript
// src/types/protocol.ts

export type WidgetType = 
  | 'scale'        // 0–10 or custom min/max visual slider
  | 'numeric'      // Measured bio-markers (e.g., blood glucose, blood pressure, weight)
  | 'photo'        // Milestone photographic documentation (e.g., dermatology, posture)
  | 'timer'        // Functional timed tests (e.g., balance hold, 1-mile walk)
  | 'multichoice'  // Categorical clinical scores (e.g., Bristol stool scale, sleep quality)
  | 'boolean';     // Simple symptom/side-effect presence (yes/no)

export interface DataCollectionField {
  id: string;
  name: string;
  label: string;
  type: WidgetType;
  frequency: 'daily' | 'milestone' | 'weekly';
  milestoneDays?: number[];      // e.g. [1, 14, 30] for photo assessments
  unit?: string;                 // e.g. 'mg/dL', 'mmHg', 'degrees', 'seconds'
  min?: number;
  max?: number;
  step?: number;
  options?: string[];            // For 'multichoice' widgets
  instructions?: string;         // Standardized measurement instructions from paper
  escalationThreshold?: number;  // Threshold triggering safety escalation pause
  escalationMessage?: string;    // Clinical caution message if threshold exceeded
}

export interface MorphingDataLog {
  id: string;
  fieldId: string;
  day: number;
  loggedAt: string;
  value: number | string | boolean; // Polymorphic value (score, number, base64 image URL, or choice)
  note?: string;
}
```

### B. Updated Protocol Interface
```typescript
export interface Protocol {
  id: string;
  title: string;
  // ... existing fields ...
  dataCollectionSpec: DataCollectionField[]; // Replaces static feedbackMetric
}
```

---

## 4. Component Factory & Widget Registry

### A. The Widget Registry
A centralized dictionary of accessible, theme-compliant widget primitives residing in `src/components/routine/widgets/`:

| Widget Component | Data Type | UI & Interaction Details |
| :--- | :--- | :--- |
| **`<ScaleWidget />`** | `scale` | Slider with real-time numeric readout, semantic tones (`mint`, `cream`, `blush`), and min/max anchor labels. |
| **`<NumericWidget />`** | `numeric` | Clean input stepper with integrated unit badge (`mg/dL`, `bpm`), target range boundaries, and fast increment/decrement pills. |
| **`<PhotoWidget />`** | `photo` | Camera access & drag-and-drop file upload with standardized lighting/angle guidelines, image preview, and retake action. |
| **`<TimerWidget />`** | `timer` | One-tap countdown/stopwatch with audio chime on completion to conduct timed functional physical tests. |
| **`<MultiChoiceWidget />`** | `multichoice` | Horizontal scrollable or flex chip group with single-selection active state. |
| **`<BooleanWidget />`** | `boolean` | Minimal two-state toggle pill for binary adverse event tracking (e.g., "Nausea present?"). |

### B. Polymorphic Field Renderer
```tsx
// src/components/routine/DynamicFieldRenderer.tsx

interface DynamicFieldRendererProps {
  field: DataCollectionField;
  value: any;
  onChange: (value: any) => void;
}

export function DynamicFieldRenderer({ field, value, onChange }: DynamicFieldRendererProps) {
  switch (field.type) {
    case 'scale':
      return <ScaleWidget field={field} value={value} onChange={onChange} />;
    case 'numeric':
      return <NumericWidget field={field} value={value} onChange={onChange} />;
    case 'photo':
      return <PhotoWidget field={field} value={value} onChange={onChange} />;
    case 'timer':
      return <TimerWidget field={field} value={value} onChange={onChange} />;
    case 'multichoice':
      return <MultiChoiceWidget field={field} value={value} onChange={onChange} />;
    case 'boolean':
      return <BooleanWidget field={field} value={value} onChange={onChange} />;
    default:
      return null;
  }
}
```

---

## 5. Milestone Scheduling (Preventing User Fatigue)

A critical clinical flaw in patient apps is asking for every measurement every day. If a user has to upload a photo every morning, adherence plummets by 70%.

### Milestone Logic
- **Daily Routine (Standard Days)**: 
  - Only fields with `frequency: 'daily'` are displayed.
  - Takes <15 seconds to log.
- **Milestone Days (e.g. Day 1, Day 14, Day 30)**:
  - Routine card displays a special **"Milestone Evaluation Scheduled"** banner.
  - The milestone widgets (e.g., `PhotoWidget` or `TimerWidget`) unlock automatically.
  - Generates a clinical milestone badge on completion.

---

## 6. Morphing Dashboard Visualizations

When the data collection morphs, the **Dashboard** dynamically selects the appropriate analytical component:

1. **For `photo` Studies**:
   - **`<MilestonePhotoComparison />`**: Interactive before/after split-pane comparison slider comparing Day 1 baseline against the latest milestone photo (Day 14 / Day 30).
2. **For `numeric` Biomarkers**:
   - **`<BiomarkerTrendChart />`**: Time-series curve rendering patient values plotted against the study's published healthy reference range.
3. **For `scale` Metrics**:
   - **`<TolerabilityProgressionChart />`**: Daily symptom score bar graph with safety threshold line and escalation pauses highlighted in semantic blush.

---

## 7. Phased Implementation Roadmap

### Phase 1: Data Contracts & Gemini Extraction
- [x] Update `src/types/protocol.ts` with `DataCollectionField` and `MorphingDataLog`.
- [x] Extend Gemini extraction prompt in `src/server/geminiExtraction.ts` to extract `dataCollectionSpec` from paper Methods.
- [x] Add fallback specs in `src/server/fallbackProtocols.ts`:
  - Achilles Tendinopathy $\rightarrow$ `scale` (Pain VAS 0–10) & `numeric` (Lunge dorsiflexion angle)
  - Creatine Sleep Deprivation $\rightarrow$ `timer` (Psychomotor Vigilance Task), `multichoice` (Stanford Sleepiness Scale), & `scale` (GI distress)
  - Hair Loss Trial $\rightarrow$ `photo` (Milestone Baseline/Day 14/28/56/84 vertex photo) & `scale` (Scalp irritation)

### Phase 2: Widget Primitives & Factory Component
- [x] Create `src/components/routine/widgets/ScaleWidget.tsx`.
- [x] Create `src/components/routine/widgets/NumericWidget.tsx`.
- [x] Create `src/components/routine/widgets/PhotoWidget.tsx`.
- [x] Create `src/components/routine/widgets/TimerWidget.tsx`.
- [x] Create `src/components/routine/widgets/MultiChoiceWidget.tsx`.
- [x] Create `src/components/routine/widgets/BooleanWidget.tsx`.
- [x] Create polymorphic `DynamicFieldRenderer.tsx` and integrate into `FeedbackLogForm.tsx`.

### Phase 3: Milestone Awareness & Routine Integration
- [x] Update `useProtocolState.ts` to store polymorphic `morphingLogs` in `localStorage`.
- [x] Detect current day milestone status (`isMilestoneDay(protocol, currentDay)`).
- [x] Render milestone callout banner on scheduled evaluation days (`MilestoneBanner.tsx`).

### Phase 4: Morphing Dashboard Analytics
- [x] Create `src/components/dashboard/MilestonePhotoComparison.tsx`.
- [x] Create `src/components/dashboard/BiomarkerChartContent.tsx` and `BiomarkerTrendChart.tsx`.
- [x] Conditionally render visualizers in `src/views/Dashboard.tsx` based on `protocol.dataCollectionSpec`.

---

## 8. Why This Wins the Google AI Builder Cup

1. **True AI-Native Software**: The UI is not hardcoded—the Gemini model acts as an automated UI architect, reading medical literature and dynamically building the bespoke user interface required for that exact trial.
2. **Eliminates Scientific Gaps**: Solves the core challenge of medical adherence by ensuring patients track exactly what researchers measured.
3. **Showcases Multimodal Google Technology**: Demonstrates Gemini's ability to extract complex structured JSON schemas, coupled with on-device interactive media (photos, timers, and dynamic SVG charts).
