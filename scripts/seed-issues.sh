#!/usr/bin/env bash
# ==============================================================================
# Protocol Engine — Seed GitHub Issues & Action Items
# ==============================================================================
# Usage:
#   1. Make sure you are logged into GitHub CLI: gh auth login
#   2. Run: ./scripts/seed-issues.sh
# ==============================================================================

set -euo pipefail

REPO="bayu1711/viskotun1-mono"

echo "=== Protocol Engine: GitHub Issue Sync ==="

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: You are not authenticated with GitHub CLI."
  echo "Please run: gh auth login"
  exit 1
fi

echo "Authenticated successfully. Syncing tasks to $REPO..."

# Ensure standard labels exist
gh label create "completed" --color "0E8A16" --description "Completed milestone task" --repo "$REPO" --force >/dev/null 2>&1 || true
gh label create "phase-1" --color "5319E7" --description "Phase 1: Foundation" --repo "$REPO" --force >/dev/null 2>&1 || true
gh label create "phase-2" --color "1D76DB" --description "Phase 2: Gemini 1.5 & Gatekeeper" --repo "$REPO" --force >/dev/null 2>&1 || true
gh label create "phase-3" --color "FBCA04" --description "Phase 3: State Durability" --repo "$REPO" --force >/dev/null 2>&1 || true
gh label create "phase-4" --color "D93F0B" --description "Phase 4: Cloud Run Deployment" --repo "$REPO" --force >/dev/null 2>&1 || true
gh label create "phase-5" --color "006B75" --description "Phase 5: Digital Experiences & TTS" --repo "$REPO" --force >/dev/null 2>&1 || true

echo "Creating completed historical issues..."

# 1. Next.js 14 Migration (Closed)
ISSUE_1=$(gh issue create --repo "$REPO" \
  --title "feat(core): Next.js 14 App Router migration & full-stack unification" \
  --label "completed,phase-1" \
  --body "### Summary
Migrated the entire Vite SPA to Next.js 14.2+ App Router.
- Unified frontend and backend into a single repository (Next.js Route Handlers).
- Configured \`output: 'standalone'\` for Cloud Run container deployment.
- Set up SEO metadata and Server Components in \`src/app/layout.tsx\`.

**Completed in**: Commit \`c81dfe5\`")
echo "Created $ISSUE_1"
gh issue close "$ISSUE_1" --reason "completed" --comment "Verified and pushed to main." >/dev/null

# 2. DRY & Memory Safety (Closed)
ISSUE_2=$(gh issue create --repo "$REPO" \
  --title "refactor(core): eliminate DRY violations, prop drilling, and timer memory leaks" \
  --label "completed,phase-1" \
  --body "### Summary
- Lifted \`PainLogDrawer\` to shared \`ProtocolContext\` and mounted once in \`AppShell.tsx\`.
- Cleaned up \`useRef\` timer intervals to eliminate memory leaks on unmount.
- Replaced lossy integer round-trip math with raw \`todayFraction\` metrics.
- Added dynamic imports with \`ssr: false\` for Recharts components.

**Completed in**: Commit \`1723829\`")
echo "Created $ISSUE_2"
gh issue close "$ISSUE_2" --reason "completed" --comment "Verified and pushed to main." >/dev/null

# 3. Scientific Gatekeeper (Closed)
ISSUE_3=$(gh issue create --repo "$REPO" \
  --title "feat(gatekeeper): scientific scope validation and high-fidelity fallback protocols" \
  --label "completed,phase-2" \
  --body "### Summary
- Built strict scientific gatekeeper (\`isTheoreticalOrNonHuman\`) enforcing human interventional studies only.
- Gracefully declines theoretical physics, pure math, animal/rodent models, and observational papers.
- Created fallback protocols (*Creatine & Sleep Deprivation*, *Patellar HSR Rehab*) for zero-API-key local testing.

**Completed in**: Commit \`184a1c5\`")
echo "Created $ISSUE_3"
gh issue close "$ISSUE_3" --reason "completed" --comment "Verified and pushed to main." >/dev/null

# 4. Gemini 1.5 Multimodal Extraction (Closed)
ISSUE_4=$(gh issue create --repo "$REPO" \
  --title "feat(api): multimodal Gemini 1.5 PDF paper extraction pipeline" \
  --label "completed,phase-2" \
  --body "### Summary
- Built \`POST /api/extract\` using \`@google/generative-ai\` Gemini 1.5 Flash.
- Direct PDF base64 \`inlineData\` transmission (zero OCR/local parser fragility).
- Audits and flags missing parameters with \`inferred: true\` and conservative baselines.

**Completed in**: Commit \`fcda23f\`")
echo "Created $ISSUE_4"
gh issue close "$ISSUE_4" --reason "completed" --comment "Verified and pushed to main." >/dev/null

# 5. Clinical Safety Assistant (Closed)
ISSUE_5=$(gh issue create --repo "$REPO" \
  --title "feat(api): Gemini-grounded clinical safety assistant route" \
  --label "completed,phase-2" \
  --body "### Summary
- Built \`POST /api/assistant\` for study Q&A grounded strictly in the Methods section and contraindications.
- Explicitly declines unstudied medical advice with safety recommendations.
- Local FAQ fallback for offline/development resilience.

**Completed in**: Commit \`0860f95\`")
echo "Created $ISSUE_5"
gh issue close "$ISSUE_5" --reason "completed" --comment "Verified and pushed to main." >/dev/null

# 6. Client Upload & Dynamic State (Closed)
ISSUE_6=$(gh issue create --repo "$REPO" \
  --title "feat(ui): connect upload dropzone and assistant sheet to extraction pipeline" \
  --label "completed,phase-2" \
  --body "### Summary
- Connected window drag-and-drop, \`UploadDropzone\`, and DOI input to live \`uploadPaper\` handler.
- Real-time extraction progress stages rendered in the chat stream.
- Switches active protocol immediately upon successful extraction or displays an educational alert card if declined.

**Completed in**: Commit \`f7c130e\`")
echo "Created $ISSUE_6"
gh issue close "$ISSUE_6" --reason "completed" --comment "Verified and pushed to main." >/dev/null

echo "Creating upcoming open action items..."

# 7. LocalStorage Persistence (Open)
ISSUE_7=$(gh issue create --repo "$REPO" \
  --title "feat(storage): LocalStorage state hydration & offline session durability" \
  --label "phase-3" \
  --body "### Objective
Currently, protocol progress (completed sets, pain logs) and newly extracted research papers live in React memory. If a user refreshes the browser, the state resets to mock defaults.

### Tasks
- [ ] Add \`localStorage\` hydration to \`useProtocolState.ts\` for:
  - Custom extracted protocols in \`protocolList\`
  - \`activeProtocolId\`
  - Runtime sets completed (\`setsDone\`)
  - Pain logs and side effect notes
- [ ] Add a clean \"Reset to Demo Defaults\" button in the UI for judges/testers.
- [ ] Ensure safe SSR hydration (no client/server mismatch).

### Acceptance Criteria
- Uploading a paper, checking off Day 1 sets, and refreshing the browser keeps all data intact.")
echo "Created open task: $ISSUE_7"

# 8. Cloud Run Dockerfile (Open)
ISSUE_8=$(gh issue create --repo "$REPO" \
  --title "build(deploy): production multi-stage Dockerfile & Cloud Run deployment config" \
  --label "phase-4" \
  --body "### Objective
Package the application for deployment to Google Cloud Run as required for the Google AI Builder Cup.

### Tasks
- [ ] Create multi-stage \`Dockerfile\` targeting Next.js \`output: 'standalone'\` (\`deps\` -> \`builder\` -> \`runner\`).
- [ ] Create \`.dockerignore\` excluding \`node_modules\`, \`.git\`, and local env files.
- [ ] Create \`.env.example\` documenting \`GEMINI_API_KEY\`, \`GOOGLE_CLOUD_PROJECT\`, and deployment instructions.
- [ ] Verify image build locally: \`docker build -t protocol-engine .\`

### Acceptance Criteria
- Container runs under non-root \`nextjs:nodejs\` user with production image size under 150MB.")
echo "Created open task: $ISSUE_8"

# 9. Printable Physician Summary (Open)
ISSUE_9=$(gh issue create --repo "$REPO" \
  --title "feat(report): 1-page printable physician summary brief" \
  --label "phase-5" \
  --body "### Objective
Replace the simulated export timer in \`PhysicianSummaryPanel.tsx\` with a functional 1-page clinical brief to give to doctors or physical therapists.

### Tasks
- [ ] Build a dedicated printable view / modal with \`@media print\` stylesheet.
- [ ] Include protocol name, trial DOI, compliance percentage, pain score history, and progression notes.
- [ ] Wire the 'Export 1-Page Summary' button to trigger print/save dialog.

### Acceptance Criteria
- Clicking export opens a formatted 1-page document ready to save as PDF or print.")
echo "Created open task: $ISSUE_9"

# 10. Voice Coaching TTS (Open)
ISSUE_10=$(gh issue create --repo "$REPO" \
  --title "feat(voice): routine voice coaching via Google Cloud Text-to-Speech (TTS)" \
  --label "phase-5" \
  --body "### Objective
Targeting the Google AI Builder Cup *Media, Content & Digital Experiences* track by adding audio voice guidance during routine execution.

### Tasks
- [ ] Create server route \`/api/tts\` generating audio speech using Google Cloud Text-to-Speech.
- [ ] Audio companion reads step instructions, tempo cadence (\"3 seconds down, 1 second up\"), and hold countdowns.
- [ ] Add player controls in the routine view (Play, Pause, Skip step).

### Acceptance Criteria
- User can press Play and perform their daily routine hands-free guided by voice cues.")
echo "Created open task: $ISSUE_10"

echo ""
echo "=== All tasks synchronized to https://github.com/$REPO/issues ==="
