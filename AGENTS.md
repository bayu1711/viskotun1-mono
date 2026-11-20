# TrialN1 — AI Agent Guidelines (`AGENTS.md`)

This document establishes the architectural principles, engineering standards, and operational guidelines for any AI agent or developer working on the **TrialN1** codebase.

---

## 1. Core Engineering Principles

### A. Strict DRY (Don't Repeat Yourself)
- **Single Source of Truth for State & Modals**: Never mount duplicate modal dialogs or drawers across different views. Shared modals (such as `FeedbackDrawer`, `AssistantSheet`) must be mounted **once** in [`AppShell.tsx`](file:///src/components/layout/AppShell.tsx) and controlled via shared Context.
- **No Prop Drilling for Global Actions**: Actions like opening a drawer (`openFeedbackDrawer`) or triggering the assistant must be exposed via React Context (`useRoutine`, `useAssistant`), not passed down through multiple component levels.
- **No Lossy Round-Trip Calculations**: When derived metrics exist as raw ratios (e.g. `todayFraction: 0–1`), export and consume them directly. Never round-trip them into display integers and back (`ratio -> toPercent -> toFraction`).
- **Centralized Design Tokens & Tones**: Use the established semantic palette (`ink`, `mint`, `cream`, `blush`, `white`). Do not invent ad-hoc hex colors or duplicate variant dictionaries across components without using the shared utilities in `src/utils/tones.ts`.
- **Centralized UI Copy**: All user-facing strings, button labels, and system messages must be declared in [`src/data/copy.ts`](file:///src/data/copy.ts) for consistency and future localization.

### B. Full-Stack Next.js 16 (App Router) Architecture
- **Unified Codebase (No Separate Backend Repositories)**: Next.js Route Handlers (`src/app/api/...`) are our backend. Do not propose spinning up a separate server.
- **Client vs. Server Component Boundaries**:
  - Keep `src/app/layout.tsx` a Server Component for SEO and metadata.
  - Client state, hooks, event listeners, and interactive UI must live in components marked `'use client'`.
  - Providers must be grouped into `src/app/providers.tsx`.
- **Zero Secrets on Client**:
  - Google Cloud credentials, Vertex AI keys, and service account tokens must **only** be accessed in server routes (`src/app/api/...` or `src/lib/...`). Never expose private keys to client bundles.
- **SSR-Safe Third-Party Libraries**:
  - Window- or canvas-measuring libraries (such as Recharts in [`DropOffChart.tsx`](file:///src/components/community/DropOffChart.tsx)) must be loaded with `dynamic(() => import(...), { ssr: false })` to avoid hydration mismatches.

### C. Domain Modeling: Interventional Human Science Only
- **Scope Guardrail**: TrialN1 specializes strictly in **Interventional Human Research** (clinical rehabilitation, pharmacology, sleep hygiene, nutrition/fasting, cognitive focus, ergonomics).
- **Reject Non-Actionable Papers**: Do not generate hallucinated routines for theoretical physics, macroeconomics, or pure math. The system must gracefully reject papers that lack an actionable routine applied to human participants.

### D. React Lifecycle & Memory Safety
- **Safe Timer Cleanup**: Any `setTimeout` or `setInterval` stored in a `useRef` must be safely cancelled in the `useEffect` cleanup function using `ref.current` directly to avoid memory leaks or unmounted state updates.
- **Context Value Memoization**: Any Context provider passing an object value must wrap that object in `useMemo` to prevent app-wide cascading re-renders on every state update.

---

## 2. Git & Version Control Protocol

Every agent working on this codebase must follow these streamlined git practices:

1. **Lightweight Verification Only (No Automatic `npm run build`)**:
   - Do **NOT** run full `npm run build` during task iterations, edits, or commits. Production builds are run manually by the user to avoid heavy CPU contention and latency.
   - Run lightweight checks (`npm run lint` or targeted unit tests) only when relevant to the modified files.
2. **Atomic, Granular Slicing (No Monolithic Commits)**:
   - Commit after every isolated layer or logical milestone. Never bundle package dependencies, core types, backend routes, and UI components into a single massive commit.
   - Slice commits by architectural layer:
     - `build(deps): ...` — Library installations and configuration changes
     - `feat(types): ...` or `feat(copy): ...` — Core data contracts, types, and UI copy
     - `feat(server): ...` or `feat(api): ...` — Server route handlers, schemas, and gatekeeper logic
     - `feat(ui): ...` — Presentation components, hooks, and client state wiring
     - `docs(...)`: ... — Documentation, guidelines, or architectural notes
3. **Traceability & History Integrity**:
   - Each commit should explain *what* and *why*, enabling clean rollbacks and bisecting if an edge case emerges.
4. **Never Push Directly to `main`**:
   - `main` is strictly reserved for production releases and must **NEVER** be pushed to directly during feature work or automated commits.
   - Active work is conducted on feature branches or directly merged into **`dev_staging`**. Push feature branches and `dev_staging` to remote (`origin dev_staging`).
5. **Single Development Environment (No Sandbox Worktree)**:
   - There is no separate sandbox worktree. All development runs directly in `viskotun1`.
   - Never spawn or rebuild a secondary sandbox repository.

---

## 3. Tech Stack Reference

- **Framework**: Next.js 16.4+ (App Router), React 19
- **Environments & Ports**:
  - **Local Dev**: Port `3010` (`viskotun1`, outputs to `.next-dev` to prevent style asset wiping)
- **Language**: TypeScript (Strict mode enabled)
- **Styling**: Tailwind CSS 3.4+ with custom CSS variable design tokens
- **Icons**: Material UI Icons (`@mui/icons-material`, imported via root package)
- **Animation**: Framer Motion
- **Toasts**: Sonner
- **Charts**: Recharts (client-only dynamic imports)
- **Cloud & AI Targets**: Google Cloud Run (`output: 'standalone'`), Gemini on Vertex AI
