#!/usr/bin/env bash
# ==============================================================================
# ViskotuN1 — Seed GitHub Issues & Action Items (Granular Slices)
# ==============================================================================
# Usage:
#   1. Sign in to GitHub CLI: gh auth login
#   2. Run: ./scripts/seed-issues.sh
# ==============================================================================

set -euo pipefail

REPO="bayu1711/viskotun1-mono"

echo "=== ViskotuN1: Granular GitHub Issue Sync ==="

if ! gh auth status >/dev/null 2>&1; then
  echo "Error: You are not authenticated with GitHub CLI."
  echo "Please run: gh auth login"
  exit 1
fi

echo "Authenticated successfully. Syncing granular tasks to $REPO..."

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

echo "Creating granular, bite-sized action items..."

# Task 1: Sets and Pain Logs Storage
gh issue create --repo "$REPO" \
  --title "feat(storage): persist completed sets and pain logs in localStorage" \
  --label "phase-3" \
  --body "### Objective
Keep user check-ins and pain logs saved across browser refreshes.

### Target Files
- \`src/hooks/useProtocolState.ts\`

### Tasks
- [ ] Save \`runtime[protocolId].setsDone\` to \`localStorage\` on update.
- [ ] Save \`runtime[protocolId].painLogs\` to \`localStorage\` on update.
- [ ] Hydrate saved counts and logs safely after initial mount.

### Acceptance Criteria
- Check off 2 sets on Day 4, log pain score of 2, refresh the browser $\rightarrow$ counts and log remain intact." >/dev/null
echo "Created Task: persist completed sets and pain logs"

# Task 2: Uploaded Protocols Storage
gh issue create --repo "$REPO" \
  --title "feat(storage): persist custom uploaded protocols across browser sessions" \
  --label "phase-3" \
  --body "### Objective
Ensure papers uploaded and extracted by the user do not disappear on page reload.

### Target Files
- \`src/hooks/useProtocolState.ts\`

### Tasks
- [ ] Save newly added protocols in \`protocolList\` to \`localStorage\`.
- [ ] Save current \`activeProtocolId\` so the user stays on their active paper.
- [ ] Merge saved protocols with defaults during client hydration.

### Acceptance Criteria
- Upload a new PDF, wait for extraction to complete, refresh the browser $\rightarrow$ custom protocol remains in sidebar and active." >/dev/null
echo "Created Task: persist custom uploaded protocols"

# Task 3: Reset to Demo Defaults
gh issue create --repo "$REPO" \
  --title "feat(ui): add 'Reset to Demo Defaults' action in TopBar" \
  --label "phase-3" \
  --body "### Objective
Allow judges and testers to wipe local storage and restore clean baseline mock data with 1 click.

### Target Files
- \`src/components/layout/TopBar.tsx\`
- \`src/hooks/useProtocolState.ts\`
- \`src/data/copy.ts\`

### Tasks
- [ ] Add \`resetToDefaults()\` function in protocol state.
- [ ] Add subtle reset button or menu item in \`TopBar.tsx\`.
- [ ] Show toast notification on reset.

### Acceptance Criteria
- Clicking reset clears \`localStorage\` and resets active protocol back to Achilles Day 4." >/dev/null
echo "Created Task: add Reset to Demo Defaults action"

# Task 4: Multi-Stage Dockerfile
gh issue create --repo "$REPO" \
  --title "build(docker): create multi-stage production Dockerfile and .dockerignore" \
  --label "phase-4" \
  --body "### Objective
Containerize the Next.js standalone application for Google Cloud Run deployment.

### Target Files
- \`Dockerfile\`
- \`.dockerignore\`

### Tasks
- [ ] Create 3-stage build: \`deps\`, \`builder\`, \`runner\`.
- [ ] Run container with unprivileged user \`nextjs:nodejs\`.
- [ ] Configure \`EXPOSE 3000\` and \`CMD [\"node\", \"server.js\"]\`.
- [ ] Verify \`docker build -t protocol-engine .\` completes with image size < 150MB.

### Acceptance Criteria
- Container starts locally with \`docker run -p 3000:3000 protocol-engine\` and serves the app." >/dev/null
echo "Created Task: create multi-stage Dockerfile"

# Task 5: Cloud Run Guide & .env.example
gh issue create --repo "$REPO" \
  --title "docs(env): create .env.example and Cloud Run deployment guide" \
  --label "phase-4" \
  --body "### Objective
Document environment variables and zero-friction Google Cloud Run deployment commands.

### Target Files
- \`.env.example\`
- \`README.md\`

### Tasks
- [ ] Document \`GEMINI_API_KEY\` and optional Vertex AI settings in \`.env.example\`.
- [ ] Add clear \`gcloud run deploy\` instructions in \`README.md\` for hackathon evaluators.

### Acceptance Criteria
- A new developer or judge can follow the instructions to deploy the container to Cloud Run in under 5 minutes." >/dev/null
echo "Created Task: create .env.example and Cloud Run guide"

# Task 6: Printable Shareable Summary Layout
gh issue create --repo "$REPO" \
  --title "feat(report): build printable 1-page clinical summary layout with @media print" \
  --label "phase-5" \
  --body "### Objective
Create a clean, 1-page clinical brief layout suitable for specialists or personal tracking.

### Target Files
- \`src/components/dashboard/ShareableSummaryModal.tsx\` (new)
- \`src/data/copy.ts\`

### Tasks
- [ ] Build modal view displaying protocol title, trial DOI, adherence %, symptom score timeline, and contraindications.
- [ ] Add \`@media print\` CSS so printing isolates the 1-page summary card and hides sidebar/nav.

### Acceptance Criteria
- Browser print preview displays a clean, single-page professional clinical summary without page overflows." >/dev/null
echo "Created Task: build printable clinical summary layout"

# Task 7: Wire Shareable Summary Export Trigger
gh issue create --repo "$REPO" \
  --title "feat(ui): wire Shareable Summary export button to trigger print/PDF dialog" \
  --label "phase-5" \
  --body "### Objective
Replace the simulated export timer with the actual print / PDF trigger.

### Target Files
- \`src/components/dashboard/ShareableSummaryPanel.tsx\`
- \`src/hooks/useSimulatedExport.ts\`

### Tasks
- [ ] Replace simulated timeout with opening the printable summary modal / calling \`window.print()\`.
- [ ] Display confirmation toast upon successful trigger.

### Acceptance Criteria
- Clicking 'Export 1-Page Summary' opens the printable view immediately." >/dev/null
echo "Created Task: wire export button to print trigger"

# Task 8: Google Text-to-Speech API Route
gh issue create --repo "$REPO" \
  --title "feat(api): implement /api/tts Route Handler with Google Cloud Text-to-Speech" \
  --label "phase-5" \
  --body "### Objective
Generate realistic audio speech for routine voice coaching (Google AI Builder Cup track feature).

### Target Files
- \`src/app/api/tts/route.ts\` (new)
- \`package.json\` (\`@google-cloud/text-to-speech\`)

### Tasks
- [ ] Create Route Handler accepting text string and returning MP3 audio buffer.
- [ ] Fall back gracefully to browser Web Speech API if Google Cloud credentials are not configured.

### Acceptance Criteria
- \`POST /api/tts\` returns audio streaming with realistic cadence." >/dev/null
echo "Created Task: implement /api/tts Route Handler"

# Task 9: Voice Coaching Companion Bar
gh issue create --repo "$REPO" \
  --title "feat(ui): add voice coaching companion bar to routine view" \
  --label "phase-5" \
  --body "### Objective
Allow users to perform their daily rehab routine hands-free guided by voice cues.

### Target Files
- \`src/components/routine/VoiceCoachBar.tsx\` (new)
- \`src/views/Routine.tsx\`

### Tasks
- [ ] Add player bar with Play, Pause, and Skip step controls.
- [ ] Audio companion reads step description, tempo cues (\"3 seconds down\"), and rest countdowns.

### Acceptance Criteria
- User clicks Play $\rightarrow$ audio guides them through Step 1, plays hold countdown, and advances to Step 2." >/dev/null
echo "Created Task: add voice coaching companion bar"

# Task 10: Community Insights Tooltips
gh issue create --repo "$REPO" \
  --title "feat(community): add interactive drop-off tooltips and outcome review filters" \
  --label "phase-5" \
  --body "### Objective
Enhance community evidence charts and patient reviews.

### Target Files
- \`src/components/community/DropOffPanel.tsx\`
- \`src/components/community/ReviewList.tsx\`

### Tasks
- [ ] Add interactive hover tooltips displaying exact drop-off % and reason per day/week.
- [ ] Enable filtering reviews by outcome (improved, adjusted, paused).

### Acceptance Criteria
- Clicking outcome filters updates the review stream smoothly without reloads." >/dev/null
echo "Created Task: add community tooltips and review filters"

echo ""
echo "=== All granular tasks synchronized to https://github.com/$REPO/issues ==="
