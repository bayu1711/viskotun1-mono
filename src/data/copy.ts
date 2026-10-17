const DEFAULT_LOAD_REDUCTION_PERCENT = 20;

/** Centralized UI copy. Routine-specific content lives in data/routines. */
export const COPY = {
  metadata: {
    lang: 'en',
    title: 'ViskotuN1 // AI Research & Daily Routines',
    description:
      'An AI-powered digital experience transforming complex peer-reviewed research papers into executable, adaptive, and personalized routines.',
    keywords: [
      'health routines',
      'clinical routines',
      'AI research extraction',
      'clinical trials',
      'personalized medicine',
      'rehabilitation'
    ],
    openGraphTitle: 'ViskotuN1 // AI Research & Daily Routines',
    openGraphDescription:
      'Transforming complex research papers into executable daily routines with an adaptive AI safety assistant.'
  },
  brand: {
    mark: '//',
    name: 'ViskotuN1',
    initials: 'VN',
    logoUrl: '/images/viskotun1-logo.png',
    iconUrl: '/images/viskotun1-icon.png'
  },
  greeting: {
    morning: 'Morning,',
    afternoon: 'Afternoon,',
    evening: 'Evening,'
  },
  common: {
    percentComplete: (percent: number) => `${percent}% complete`,
    opensInNewTab: '(opens in a new tab)',
    percentSign: '%',
    warningPrefix: '⚠'
  },
  nav: {
    primaryLabel: 'Primary',
    mobileLabel: 'Primary mobile',
    today: 'Today',
    stats: 'Stats',
    community: 'Community'
  },
  shell: {
    streak: (days: number) => `${days} day streak`,
    addPaper: 'Add new paper',
    openAssistant: 'Open paper assistant',
    resetDemo: 'Reset to demo defaults',
    assistantFab: (title: string) => `Ask about ${title} or drop a PDF`,
    todaySummaryLabel: "Today's progress",
    noActiveProtocol: 'No active routine',
    noActiveRoutine: 'No active routine',
    noActivePrompt: 'Upload a research paper or explore trending routines to start tracking.',
    dayOfTotal: (day: number, total: number) => `Day ${day} / ${total}`,
    dropTitle: 'Drop to extract',
    dropSubtitle: "We'll isolate the methods & build a routine",
    dropScope: 'Interventional human research · clinical trials, RCTs & behavioral routines'
  },
  switcher: {
    heading: 'Your papers',
    addPaper: 'Add new paper',
    meta: (day: number, total: number, percent: number) => `Day ${day}/${total} · ${percent}% today`
  },
  papers: {
    queuedNote: 'Extracting routine…',
    initialQueuedPaperName: 'Evening Light Restriction & Sleep Latency',
    initialQueuedPaperNote: 'Pilot trial · awaiting your review'
  },
  routine: {
    eyebrow: (day: number, total: number) => `Day ${day} of ${total}`,
    title: (percent: number) => `${percent}% complete`,
    progressLabel: 'Daily progress',
    historyEyebrow: 'Routine',
    historyTitle: 'History',
    openDashboard: 'Open dashboard',
    feedbackEyebrow: 'Feedback',
    feedbackTitle: 'Log',
    metricEyebrow: (name?: string) => (name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Feedback'),
    metricTitle: (title?: string) => (title ? title.charAt(0).toUpperCase() + title.slice(1) : 'Log'),
    feedbackDay: (day: number) => `Day ${day}`,
    noNotes: 'No notes',
    emptyFeedbackTitle: 'No feedback logged yet',
    emptyMetricTitle: (name?: string) => (name ? `No ${name} logged yet` : 'No feedback logged yet'),
    emptyFeedbackBody: 'Log how you feel after each session so the routine can adapt.',
    emptyStepsTitle: 'No steps extracted',
    emptyStepsBody: 'This paper did not report an executable routine.'
  },
  dayActions: {
    markComplete: 'Mark today complete',
    dayLogged: (day: number) => `✓ Day ${day} logged`,
    logFeedback: (name?: string) => (name ? `Log ${name}` : 'Log feedback')
  },
  safety: {
    escalationAlert: `Feedback threshold exceeded. Escalation paused. Recommendation: Reduce load/dose by ${DEFAULT_LOAD_REDUCTION_PERCENT}% tomorrow or consult a specialist.`,
    dynamicEscalationAlert: (name?: string, customMessage?: string) =>
      customMessage ||
      `${name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Symptom'} threshold exceeded. Escalation paused. Recommendation: Reduce load/dose by ${DEFAULT_LOAD_REDUCTION_PERCENT}% tomorrow or consult your specialist.`,
    escalationShort: `Escalation paused — load/dose reduced ${DEFAULT_LOAD_REDUCTION_PERCENT}% for tomorrow`,
    pausedRecommendation: `Paused — reduce load/dose by ${DEFAULT_LOAD_REDUCTION_PERCENT}% tomorrow.`,
    clinicalDisclaimer:
      'Medical Disclaimer: ViskotuN1 provides educational routine extraction grounded strictly in human interventional clinical literature. It does not provide medical diagnosis, prescription, or replace personalized clinical supervision from a licensed physician or physical therapist.',
    baselineEscalationAlert:
      `Pain threshold exceeded. Escalation paused. Recommendation: Reduce load by ${DEFAULT_LOAD_REDUCTION_PERCENT}% tomorrow or consult your therapist.`
  },
  calendar: {
    listLabel: 'Routine day history',
    range: (start: number, end: number, total: number) => `Days ${start}–${end} of ${total}`,
    upcoming: (day: number) => `Day ${day}, upcoming`,
    progress: (day: number, percent: number) => `Day ${day}, ${percent}% complete`,
    legend: {
      complete: 'Complete',
      partial: 'Partial',
      today: 'Today'
    }
  },
  severityLevels: {
    mild: 'Mild',
    moderate: 'Moderate',
    severe: 'Severe'
  },
  feedbackDrawer: {
    defaultMetricName: 'Feedback',
    defaultMetric: {
      name: 'Biofeedback',
      label: 'Symptom / exertion score',
      eyebrow: 'Feedback',
      logTitle: 'Log check-in',
      minLabel: '0 · None',
      maxLabel: '10 · Severe'
    },
    dialogLabel: 'Log subjective feedback',
    metricDialogLabel: (name?: string) => `Log ${name || 'feedback or side effect'}`,
    close: 'Close',
    header: (day: number) => `Feedback · Day ${day}`,
    metricHeader: (name: string, day: number) => `${name} · Day ${day}`,
    decrease: 'Decrease score',
    decreaseMetric: (name: string) => `Decrease ${name} score`,
    increase: 'Increase score',
    increaseMetric: (name: string) => `Increase ${name} score`,
    ofMax: (max: number) => `of ${max}`,
    sliderLabel: (min: number, max: number) => `Score scale from ${min} to ${max}`,
    metricSliderLabel: (name: string, min: number, max: number) => `${name} scale from ${min} to ${max}`,
    sliderValue: (score: number, max: number, level: string) => `${score} out of ${max}, ${level}`,
    minLabel: (min: number) => `${min} · None`,
    maxLabel: (max: number) => `${max} · Severe`,
    notesLabel: 'Notes',
    notesPlaceholder: 'Optional notes for AI adjustment...',
    save: 'Save log to plan',
    saved: 'Log saved to your plan',
    savedMetric: (name?: string) => `${name || 'Feedback'} saved to your plan`
  },
  task: {
    complete: (action: string) => `Complete ${action}`,
    uncheck: (action: string) => `Uncheck ${action}`,
    decrease: (action: string) => `Decrease progress for ${action}`,
    increase: (action: string) => `Increase progress for ${action}`,
    counterLabel: (action: string) => `Progress counter for ${action}`,
    frequency: 'Frequency:',
    source: 'Source:',
    sourcePaper: 'Paper',
    sourceDefaulted: 'Defaulted',
    inferredMarker: ' *',
    inferredNote: '* Parameter not reported by authors — conservative clinical default applied',
    defaultSetLabel: 'Sets',
    holdStatLabel: 'Hold:',
    repsStatLabel: 'Reps:',
    targetStatLabel: 'Target:',
    perSetHold: (seconds: number) => `× ${seconds}s hold`,
    perSetReps: (reps: number) => `× ${reps} reps`,
    singleUnitPerSet: (label: string) => `× 1 ${label}`,
    singleUnitStat: (label: string) => `1 ${label}`,
    holdValue: (seconds: number) => `${seconds}s`,
    holdSummary: (seconds: number) => `${seconds}s hold`,
    repsSummary: (reps: number) => `${reps} reps`
  },
  protocolCard: {
    label: 'Extracted routine',
    eyebrow: (phase: string) => `Extracted · ${phase}`,
    title: 'Your routine',
    openRoutine: "Open today's routine",
    defaulted: ' · Defaulted',
    rulePrefix: 'Rule: if',
    ruleArrow: '→'
  },
  routineCard: {
    label: 'Extracted routine',
    eyebrow: (phase: string) => `Extracted · ${phase}`,
    title: 'Your routine',
    openRoutine: "Open today's routine",
    defaulted: ' · Defaulted',
    rulePrefix: 'Rule: if',
    ruleArrow: '→'
  },
  missingData: {
    caution: 'Caution: The authors omitted exact dosing or execution parameters for',
    fallback: 'System defaulted to conservative baseline parameters.'
  },
  dashboard: {
    eyebrow: 'Track',
    title: 'Your experiments',
    metricsLabel: 'Key metrics',
    activeProtocol: 'Active routine',
    activeRoutine: 'Active routine',
    adherence: 'Adherence',
    currentPhase: 'Current phase',
    evidenceScore: 'Evidence score',
    evidenceCaption: (trial: string, sampleSize: number) => `${trial} · N = ${sampleSize}`,
    compliance: {
      high: 'High compliance',
      moderate: 'Moderate',
      low: 'Low'
    },
    phase: {
      paused: 'Escalation paused',
      ready: 'Progression trigger ready',
      holding: 'Holding current phase'
    },
    papersLabel: 'All papers',
    papersEyebrow: 'All',
    papersTitle: 'Papers',
    paperMeta: (day: number, total: number, streak: number) => `Day ${day}/${total} · ${streak} days`,
    activeSuffix: ' · Active',
    sourcePaper: 'Source paper',
    emptyPapersTitle: 'No papers yet',
    emptyPapersBody: 'Drop a research PDF to extract your first routine.',
    progressionEyebrow: 'Next step',
    progressionTitle: 'Progression',
    progressionHolding: 'Holding until the progression rule threshold is met.',
    progressionReady: (condition: string, action: string) => `${condition}. ${action}.`
  },
  evidence: {
    rctShort: 'RCT',
    pilotShort: 'Pilot',
    high: 'High',
    moderate: 'Moderate'
  },
  shareableSummary: {
    eyebrow: 'Shareable',
    title: 'Routine summary',
    cardTitle: '1-Page brief',
    body: (title: string) =>
      `1-Page brief of ${title}: trial citation, daily routine, adherence rate, and logs to share with your coach, specialist, or personal records.`,
    export: '📄 View & print 1-page summary',
    exporting: 'Preparing 1-page summary…',
    success: '✓ 1-Page summary ready',
    successToast: 'Shareable summary generated',
    error: "We couldn't generate the summary. Check your connection and try again.",
    errorToast: 'Export failed',
    retry: 'Try again',
    printButton: 'Print / save as PDF',
    closeButton: 'Close',
    disclaimer:
      'ViskotuN1 translates human interventional research into structured daily routines. This summary is intended for personal tracking, coaching, or clinical review and does not constitute medical advice.',
    trialCitation: 'Study citation & methodology',
    adherenceAndStreak: 'Adherence & progression',
    prescribedRoutine: 'Prescribed routine & methods',
    safetyAndRules: 'Safety rules & contraindications',
    recentLogs: 'Recent biofeedback logs',
    noLogsYet: 'No biofeedback logs recorded yet.',
    generatedOn: (date: string) => `Generated on ${date}`,
    dialogLabel: 'Shareable Routine Summary and Progress Brief',
    timelineProgress: 'Timeline Progress',
    adherenceRate: 'Adherence Rate',
    consistencyStreak: 'Consistency Streak',
    progressionGate: 'Progression Gate',
    statusPaused: '⚠️ Escalation Paused',
    statusReady: '✓ Ready to Advance',
    statusHolding: 'Holding Load',
    conservativeBaseline: 'Conservative baseline',
    progressionRuleHeading: 'Progression Rule',
    safetyRulesHeading: 'Safety & Stop Rules',
    conditionLabel: 'Condition:',
    actionLabel: 'Action:',
    standardDurationFallback: 'Follow standardized clinical duration.',
    stopImmediatelyIf: 'Stop immediately if:',
    standardMonitoringFallback: 'Standard clinical monitoring; pause if severe discomfort occurs.',
    dayUnit: (count: number) => (count === 1 ? 'day' : 'days'),
    sampleSize: (sampleSize: number | string) => `Sample Size: N = ${sampleSize}`,
    dayRatio: (current: number, total: number) => `Day ${current} / ${total}`,
    briefBadge: 'Shareable Routine Brief',
    phasePrefix: 'Phase:',
    studyYear: (year: number | string) => `Study Year: ${year}`,
    doi: (doi: string) => `DOI: ${doi}`,
    dayValue: (day: number) => `Day ${day}`,
    totalDaysValue: (total: number) => `/ ${total}`,
    logScoreMeta: (day: number, score: number) => `Day ${day} · Score ${score}/10`,
    footerAudit: (doi: string) => `ViskotuN1 • Interventional Human Science • Source: ${doi}`
  },
  voiceCoach: {
    eyebrow: 'Hands-free',
    title: 'Voice coach',
    listening: 'Coaching active',
    idle: 'Hands-free audio guidance',
    play: 'Start voice coach',
    pause: 'Pause voice coach',
    resume: 'Resume voice coach',
    stepPacing: (current: number, total: number) => `Step ${current} of ${total}`,
    nextStep: 'Next step',
    prevStep: 'Previous step',
    speed: (rate: number) => `${rate}x speed`,
    speedDisplay: (rate: number) => `${rate}x`,
    soundOn: 'Sound cues on',
    soundMuted: 'Sound cues muted',
    techNote: 'Web Speech + timer cues',
    countdown: (seconds: number) => `Hold: ${seconds}s`,
    countdownComplete: 'Hold complete',
    countdownActive: (seconds: number) => `${seconds}s hold timer running`,
    stepAnnouncement: (stepNum: number, total: number, title: string, details: string) =>
      `Step ${stepNum} of ${total}: ${title}. ${details}`,
    safetyReminder: (rule: string) => `Safety reminder: ${rule}`,
    secondsRemaining: '10 seconds remaining.',
    readyToBegin: 'Ready to begin.',
    script: {
      timedHoldDetail: (sets: number, seconds: number, detail: string) =>
        `${sets} sets with a ${seconds} second hold. ${detail}.`,
      repsDetail: (sets: number, reps: number, detail: string) =>
        `${sets} sets of ${reps} repetitions. ${detail}.`,
      dosageDetail: (sets: number, unit: string, dose: string, detail: string) =>
        `${sets} ${unit}${dose}. ${detail}.`,
      defaultDosesUnit: 'doses',
      prescribedTempo: (tempo: string) => ` Prescribed tempo is ${tempo}.`
    },
    holdCountdownStart: (seconds: number) => `Begin hold for ${seconds} seconds. 3, 2, 1, start.`,
    holdFinished: 'Hold complete. Relax.',
    finishedAllSteps: 'Great work! You have completed all prescribed plan steps for today.',
    unsupported: 'Voice synthesis is not supported on this browser.'
  },
  community: {
    eyebrow: 'Community',
    title: 'Evidence insights',
    activeTab: 'Active routine insights',
    exploreTab: 'Explore trending papers',
    goToRoutine: 'Go to daily routine',
    comparisonLabel: 'Paper versus reality',
    studyEfficacy: 'Study reported efficacy',
    studyCaption: (sampleSize: number) => `Lab · N = ${sampleSize}`,
    realWorldEfficacy: 'Real-world app efficacy',
    realWorldCaption: (users: number | string) => {
      const num = typeof users === 'number' ? users : parseInt(String(users).replace(/,/g, ''), 10);
      if (isNaN(num) || num === 0) return 'Based on 0 users';
      if (num === 1) return 'Based on 1 user';
      return `Based on ${typeof users === 'number' ? users.toLocaleString() : users} users`;
    },
    dropOffLabel: 'Common drop-off points',
    dropOffEyebrow: 'Drop-off',
    hardestDays: 'Hardest days',
    hardestWeeks: 'Hardest weeks',
    peak: (unit: string, period: number) => `${unit} ${period} peak`,
    periodLabel: (unit: string, period: string | number) => `${unit} ${period}`,
    dropOffValue: (value: number) => `${value}% drop-off`,
    emptyChart: 'Not enough community data yet',
    reviewsLabel: 'User outcome reviews',
    reviewsEyebrow: 'User',
    reviewsTitle: 'Outcome reviews',
    filterLabel: 'Filter reviews by outcome',
    filters: {
      all: 'All',
      improved: 'Improved',
      adjusted: 'Adjusted',
      paused: 'Paused'
    },
    reviewMeta: (outcome: string, day: number) => `${outcome} · Day ${day}`,
    reviewAdherence: (adherence: number) => `${adherence}% adherence`,
    emptyReviews: 'No logs match this filter yet',
    fallbackInsightLead: 'Common drop-off peak at Day 7',
    fallbackInsightRest: 'due to habit formation fatigue. Keep your sets consistent.',
    fallbackReviewHandle: 'Participant · 30M',
    fallbackReviewText: 'Noticeable progression by strictly adhering to the daily prescribed sets.',
    shareExperience: 'Share your outcome',
    shareAction: 'Log outcome',
    shareModalTitle: 'Log clinical outcome',
    shareModalEyebrow: 'Community contribution',
    shareModalDesc:
      'Contribute your real-world progress to help participants on this research routine know what to expect.',
    outcomeLabel: 'Overall clinical response',
    outcomes: {
      improved: 'Improved — noticeable symptom or target progress',
      adjusted: 'Adjusted — modified load, volume, or pacing',
      paused: 'Paused — temporarily halted due to discomfort or fatigue'
    },
    dayLabel: 'Current day in routine',
    adherenceLabel: 'Routine adherence',
    notesLabel: 'Experience & practical observations',
    notesPlaceholder: 'e.g. Tendon discomfort dropped by day 5, eccentric tempo required strict focus…',
    handleLabel: 'Demographic handle (optional, anonymous)',
    handlePlaceholder: 'e.g. 34F · Runner (optional)',
    submitting: 'Submitting outcome…',
    submitReview: 'Publish to community',
    cancel: 'Cancel',
    reviewSuccessToast: 'Outcome published to community registry',
    reviewErrorToast: 'Could not submit outcome. Please try again.',
    canonicalPaperBadge: 'Canonical research paper',
    canonicalPaperNote: (doi: string) => `Deduplicated via DOI ${doi} · Shared across participants`,
    existingCanonicalFound: (title: string) => `Matched existing verified paper in community registry: ${title}`,
    emptyLiveReviews: 'No community submissions recorded yet. Be the first participant to log an outcome!'
  },
  badges: {
    rct: 'RCT gold standard',
    pilot: 'Pilot trial',
    missingParameters: '⚠ Missing parameters'
  },
  assistant: {
    dialogLabel: 'Paper assistant',
    close: 'Close assistant',
    modeLabel: 'Assistant mode',
    modes: {
      ask: 'Ask',
      upload: 'Add paper'
    },
    eyebrowUpload: 'New research',
    titleAsk: 'Ask your paper',
    titleUpload: 'Add a paper',
    typing: 'Assistant is typing',
    attach: 'Attach a PDF',
    send: 'Send',
    inputAsk: 'Ask about this paper',
    inputUpload: 'Paste a DOI or PubMed link',
    placeholderAsk: 'Ask about this paper…',
    placeholderUpload: 'Paste a DOI or PubMed link…',
    suggestionsLabel: 'Suggested questions',
    emptyTitle: 'No messages yet',
    emptyBody: 'Ask about dosing, frequency, safety or progression.',
    answerSource: 'Source · Methods section',
    engines: {
      onDeviceGemma: '⚡ On-Device Gemma',
      cloudGemini: '☁️ Gemini Flash',
      serverGemma: '⚡ Gemma 2 Endpoint',
      localRules: '🔒 Deterministic Matcher',
      onDeviceBadge: 'On-device (0ms · private)',
      cloudBadge: 'Cloud AI',
      localBadge: 'Offline matcher',
      activeEngineLabel: 'AI engine:',
      onDeviceGemmaSource: 'On-Device Gemma (Chrome Built-in AI)'
    },
    backToToday: 'Back to today',
    meta: {
      sample: 'Sample:',
      design: 'Design:',
      year: 'Year:',
      sampleValue: (sampleSize: number) => `N = ${sampleSize}`
    },
    noAnswer: (title: string) =>
      `I couldn't find that in the Methods section of this paper. Try asking about dosing, frequency, safety or progression for ${title}.`,
    confirmLogged: (day: number, score: number) =>
      `Logged Day ${day}. Biofeedback score ${score}/10. Ready for tomorrow's target.`,
    confirmSafe: (day: number, score: number) =>
      `Logged Day ${day}. Biofeedback score ${score}/10. Within the study's safe range — progression stays on track.`,
    serverGemmaSource: 'Gemma 2 (Private Endpoint)',
    methodsSectionSource: 'Methods & Interventions Section',
    timestampJustNow: 'Just now',
    parsedSummary: (pages: number | string) =>
      `Parsed ${pages} pages and isolated the Methods & Interventions section. Non-interventional sections and theoretical discussions were safely excluded.`,
    fallbackFaqQuestion: 'What is the evidence grade for this routine?',
    fallbackFaqAnswer:
      'The paper was evaluated as a randomized human intervention trial. Inferred parameters are explicitly flagged in the routine.',
    offlineAnswers: {
      safetyStopRule: (stopText: string, cautionText = '') =>
        `Safety stop rule: ${stopText}${cautionText}`,
      additionalPrecaution: (cautions: string) =>
        ` Additional study precaution: ${cautions}`,
      studyPrecautions: (cautions: string) =>
        `Study precautions: ${cautions}`,
      progressionCriteria: (rules: string) =>
        `Progression criteria: ${rules}.`,
      prescribedDailyRoutine: (summary: string) =>
        `Prescribed daily routine: ${summary}.`,
      biofeedbackMetric: (name: string, maxScore: number, threshold: number, alertMsg = '') =>
        `Daily biofeedback metric: ${name} (scale 0–${maxScore}). Escalation threshold is ≥ ${threshold}/10.${alertMsg}`,
      paperCitation: (title: string, journal: string, year: number | string, authors: string, sampleSize: number | string, trialType: string) =>
        `Study: "${title}" published in ${journal} (${year}) by ${authors}. Sample size: N = ${sampleSize} (${trialType}).`
    }
  },
  processing: {
    queued: 'Extraction queued',
    extracting: 'Extracting',
    rejectionFallback:
      'Paper declined: The study does not describe an executable intervention with human participants.',
    stages: [
      'Reading the paper',
      'Isolating methods & interventions',
      'Checking for missing parameters',
      'Building your routine draft'
    ],
    ready:
      "Draft ready for review. It'll appear in your papers once you confirm the extracted parameters."
  },
  upload: {
    title: 'Drop a research PDF',
    body: 'Or paste a DOI / PubMed link below · methods only, no hallucinated gaps',
    browse: 'Browse files',
    invalidType: 'Only PDF files are supported — please choose a .pdf',
    scopeBadge: 'Human interventional studies only',
    scopeNote:
      'Studies where researchers applied a measurable routine or intervention to human participants (clinical rehab, pharmacology, sleep, nutrition, cognitive habits). Non-human or theoretical papers without an executable routine will be declined.'
  },
  extraction: {
    title: 'Routine extraction',
    parsing: 'Analyzing paper with Gemini 1.5...',
    success: 'Routine successfully extracted and activated',
    declinedTitle: 'Paper declined by gatekeeper',
    declinedPrefix: 'Declined: ',
    declinedNonHuman:
      'This study appears to be non-human (in vitro or animal model) or purely observational. ViskotuN1 only builds executable routines from interventional studies conducted on human participants.',
    declinedTheoretical:
      'This paper appears to be theoretical physics, mathematics, or cosmology without human subject testing. ViskotuN1 is specialized for human clinical, rehabilitation, and lifestyle interventions.',
    errorTitle: 'Extraction failed',
    errorGeneral:
      'Could not extract a routine from this document. Please verify it is an interventional study or try another PDF.',
    protocolReady: (title: string) => `Routine ready: ${title}`,
    routineReady: (title: string) => `Routine ready: ${title}`,
    failedWithStatus: (status: number) => `Extraction failed with HTTP ${status}`,
    matchedBannedKeyword: (keyword: string, version: string) =>
      `Paper declined: Matched restricted non-human / theoretical policy criterion ("${keyword}"). ViskotuN1 enforces interventional human science only per clinical policy v${version}.`,
    declinedAnimalReason:
      'Declined: Non-human animal or in-vitro study. ViskotuN1 specializes strictly in interventional studies with human participants (clinical rehab, pharmacology, nutrition, sleep, cognitive habits).',
    declinedTheoreticalReason:
      'Declined: Theoretical physics, mathematics, or non-interventional topic. ViskotuN1 only builds executable routines from interventional studies conducted on human participants.'
  },
  landing: {
    heroEyebrow: 'Evidence into action',
    heroTitle: 'Transform clinical trials into executable daily routines.',
    heroSubtitle:
      'ViskotuN1 converts dense, peer-reviewed human interventional research into adaptive daily routines with zero hallucinated gaps and an evidence-grounded AI safety assistant.',
    ctaGuest: 'Try as guest (instant demo)',
    ctaLogin: 'Sign in with account',
    ctaSignup: 'Create account',
    ctaGoToApp: 'Go to your routine',
    ctaContinueAsUser: (name: string) => `Continue as ${name}`,
    ctaSignOut: 'Sign out',
    loggedInBadge: (name: string) => `Signed in as ${name}`,
    guestBadge: 'Guest session',
    scopeBadge: 'Strictly interventional human research',
    scopeNote:
      'We validate clinical trials, rehabilitation routines, nutrition, sleep, and pharmacology. Pure theory, non-human animal models, and observational studies are safely filtered out.',
    features: {
      gatekeeperTitle: 'Scientific Gatekeeper',
      gatekeeperBody: 'Auto-filters non-human models and theoretical papers with educational feedback.',
      auditingTitle: 'Missing Parameter Auditing',
      auditingBody: 'Detects omitted dosages, hold durations, and execution parameters, applying conservative clinical defaults.',
      safetyTitle: 'AI Safety Assistant',
      safetyBody: 'Ask dosage, frequency, and contraindication questions grounded strictly in the trial Methods.',
      summaryTitle: '1-Page Clinical Brief',
      summaryBody: 'Export formatted adherence and biofeedback trends for your specialist or personal records.'
    },
    demoTitle: 'Try it right now',
    demoSubtitle: 'Drop a research PDF or explore pre-loaded clinical routines with zero setup.',
    architecture: 'Architecture',
    architectureTitle: 'How ViskotuN1 works',
    capabilities: 'Capabilities',
    capabilitiesTitle: 'Built for clinical rigour',
    nav: {
      howItWorks: 'How it works',
      gatekeeper: 'Scientific gatekeeper',
      features: 'Features'
    },
    steps: {
      step1Number: 'Step 01',
      step1Title: 'Multimodal Ingestion',
      step1Body: 'Drop any clinical research PDF. Gemini 1.5 processes document bytes natively without fragile text scraping.',
      step2Number: 'Step 02',
      step2Title: 'Scientific Gatekeeper',
      step2Body: 'Verifies human interventional criteria. Theoretical physics or non-human animal assays are rejected with educational guidance.',
      step3Number: 'Step 03',
      step3Title: 'Parameter Auditing',
      step3Body: 'Detects omitted dosages, hold times, or execution parameters. Flags them as conservative clinical baselines with zero hallucinated gaps.',
      step4Number: 'Step 04',
      step4Title: 'Adaptive Routine & Q&A',
      step4Body: 'Executes daily sets, progression rules, safety & biofeedback thresholds, and answers questions strictly cited from the Methods.'
    },
    footerTagline: 'ViskotuN1 · Interventional human research intelligence',
    footerSignIn: 'Sign in',
    footerCreateAccount: 'Create account',
    footerGithub: 'GitHub'
  },
  auth: {
    loginTitle: 'Welcome back',
    loginSubtitle: 'Sign in to access your persistent routines and saved research history.',
    signupTitle: 'Create your account',
    signupSubtitle: 'Save and sync extracted research papers and daily progress across devices.',
    nameLabel: 'Your full name',
    namePlaceholder: 'e.g. Dr. Jane Smith',
    emailLabel: 'Email address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'Password',
    passwordPlaceholder: '••••••••',
    loginButton: 'Sign in',
    signupButton: 'Create account',
    googleButton: 'Continue with Google',
    guestButton: 'Continue as guest (no sign-up required)',
    guestNotice: 'Guest mode stores routines locally in your browser. Sign in anytime to sync to the cloud.',
    adminButton: 'Continue as Clinical Administrator (Admin Mode)',
    adminNotice: 'Administrator privileges enabled: Clinical Policy Ledger unlocked.',
    haveAccount: 'Already have an account? Sign in',
    needAccount: "Don't have an account? Create one",
    signOut: 'Sign out',
    guestBadge: 'Guest mode',
    adminBadge: 'Clinical Admin',
    saveNotice: 'Sign in to sync your papers to the cloud',
    orWithEmail: 'Or with email',
    signInToSyncBadge: 'Sign in to sync',
    cloudSyncedBadge: 'Cloud synced',
    defaultGuestName: 'Guest Explorer',
    defaultAdminName: 'Dr. Evelyn Vance',
    defaultClinicalUser: 'Verified Clinical User',
    defaultGoogleUser: 'Google User',
    googleResearcher: 'Google Researcher',
    defaultInvestigator: 'Clinical Investigator',
    initials: {
      guest: 'GE',
      admin: 'EV',
      clinicalUser: 'CU',
      googleUser: 'GU',
      googleResearcher: 'GR',
      investigator: 'CI',
      fallback: 'US'
    },
    currentUser: {
      name: 'Alex Rivera',
      initials: 'AR'
    },
    tabSignIn: 'Sign in',
    tabCreateAccount: 'Create account',
    toastValidEmail: 'Please enter a valid email address.',
    toastPasswordRequired: 'Please enter a password.',
    toastOperationNotAllowed: 'Email/password is disabled in Firebase console (Authentication > Sign-in method).',
    toastEmailInUse: 'An account with this email already exists.',
    toastWeakPassword: 'Password must be at least 6 characters.',
    toastInvalidCredentials: 'Invalid email or password.',
    toastTooManyRequests: 'Too many unsuccessful attempts. Please try again later.',
    toastWelcomeBack: 'Welcome back!',
    toastAccountCreated: 'Account created successfully!',
    toastAuthFailed: 'Authentication failed. Please try again.',
    toastGoogleSuccess: 'Signed in with Google!',
    toastGoogleFailed: 'Google sign-in failed.',
    toastGuestEntered: 'Entered as guest explorer',
    toastAdminEntered: 'Signed in as Clinical Administrator'
  },
  errors: {
    boundaryTitle: 'Something went wrong',
    boundaryBody: 'This view failed to load. Your logs are safe.',
    retry: 'Reload view',
    noProtocolsTitle: 'No routines available',
    noRoutinesTitle: 'No routines available',
    noProtocolsBody: 'Add a research paper to get started.',
    noRoutinesBody: 'Add a research paper to get started.'
  },
  demo: {
    resetSuccess: 'Reset to demo defaults — storage cleared'
  },
  morphing: {
    dialogTitle: (name: string, day: number) => `${name} · Day ${day}`,
    milestoneTag: 'Milestone Assessment',
    milestoneSuffix: ' (milestone)',
    dailyTag: 'Daily Metric',
    saveEntry: 'Save measurement to routine',
    savedToast: (name: string) => `${name} recorded successfully`,
    values: {
      present: 'Present',
      absent: 'Absent',
      photoAttached: 'Clinical Photo Attached',
      fieldConfirmation: (fieldName: string, day: number, displayVal: string) =>
        `${fieldName} recorded for Day ${day} (${displayVal}).`
    },
    widgets: {
      evaluationRule: 'Evaluation Rule: ',
      measurementCriteria: 'Measurement Criteria: ',
      protocolNote: 'Routine Note: ',
      routineNote: 'Routine Note: ',
      protocolGuidelines: 'Routine Test Guidelines: ',
      routineGuidelines: 'Routine Test Guidelines: ',
      photo: {
        uploadPrompt: 'Capture or upload clinical photograph',
        dropHint: 'Drag & drop image file or click to select',
        changePhoto: 'Change photo',
        retake: 'Retake',
        instructionsLabel: 'Standardized study routine guidelines:',
        previewAlt: 'Milestone clinical assessment photo',
        removePhoto: 'Remove photo',
        attached: '✓ Photo attached to milestone record',
        uploadButton: 'Upload file',
        demoCaptureButton: 'Load Demo Capture',
        demoPhotoSvgText: 'Milestone Clinical Photograph',
        demoPhotoSvg: (text: string) =>
          `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="400" height="300" fill="%23f7f5f0"/><circle cx="200" cy="150" r="80" fill="%23eedcc6"/><ellipse cx="200" cy="140" rx="35" ry="25" fill="%23dfcaa9" opacity="0.8"/><text x="200" y="270" font-family="sans-serif" font-size="12" fill="%232b2927" text-anchor="middle">${text}</text></svg>`
      },
      numeric: {
        enterValue: 'Measured value',
        referenceRange: (min?: number, max?: number, unit?: string) =>
          `Target range: ${min ?? 0}–${max ?? 100} ${unit || ''}`,
        decrease: (name: string) => `Decrease ${name}`,
        increase: (name: string) => `Increase ${name}`
      },
      timer: {
        start: 'Start test timer',
        pause: 'Pause',
        reset: 'Reset',
        complete: 'Test complete!',
        targetDuration: (seconds: number) => `Target duration: ${seconds}s`,
        secondsElapsed: (seconds: number) => `${seconds} seconds elapsed`,
        elapsedSummary: (seconds: number, max?: number) =>
          `${seconds} seconds elapsed${max ? ` · Target duration: ${max}s` : ''}`
      },
      multichoice: {
        selectOne: 'Select clinical classification:',
        defaultOptions: ['Mild', 'Moderate', 'Severe']
      },
      boolean: {
        yes: 'Yes, present',
        no: 'No, absent'
      },
      scale: {
        minimalSuffix: '· minimal',
        severeSuffix: '· severe'
      }
    },
    milestone: {
      bannerTitle: (day: number) => `Day ${day} Milestone Assessment Scheduled`,
      bannerSubtitle: 'This paper prescribes a formal outcome evaluation for today.',
      action: 'Record milestone assessment',
      completedBadge: 'Milestone documented',
      reviewAction: 'Review measurement'
    },
    dashboard: {
      photoSplitTitle: 'Milestone Photo Progression',
      photoSplitSubtitle: 'Standardized photographic evaluation across trial duration',
      baselineLabel: 'Baseline (Day 1)',
      currentLabel: (day: number) => `Milestone (Day ${day})`,
      biomarkerTitle: 'Biomarker Longitudinal Trends',
      biomarkerSubtitle: 'Patient readings tracked against published trial baseline',
      targetZone: 'Target Reference Zone',
      gridToggle: 'Standardization grid',
      noMilestonesYet: 'No milestone evaluations completed yet',
      currentReading: (val: number | string, unit?: string) => `Current: ${val} ${unit || ''}`.trim(),
      targetReference: (target: string) => `Target: ${target}`,
      milestonePeriod: 'Milestone period:',
      dragHint: 'Drag split slider horizontally to inspect morphological progression',
      overheadStandard: 'Study routine standardized 30cm overhead alignment',
      baselineAlt: 'Baseline Day 1 assessment',
      milestoneAlt: (day: number) => `Day ${day} milestone assessment`,
      sliderAria: 'Split slider comparison percentage',
      dayPill: (day: number, hasLog: boolean) => `Day ${day} ${hasLog ? '✓' : ''}`.trim(),
      previewBadge: ' (preview)',
      dayTooltip: (day: number) => `Day ${day}`,
      dayTick: (day: number) => `D${day}`,
      notScheduledPhotoNote: (currentDay: number, nextMilestone?: number, daysUntil?: number | null) =>
        nextMilestone && daysUntil
          ? `Photo assessment is not scheduled for Day ${currentDay}. Next milestone photo is scheduled for Day ${nextMilestone} (in ${daysUntil} ${daysUntil === 1 ? 'day' : 'days'}).`
          : `Photo assessment is not scheduled for Day ${currentDay}. All protocol milestone assessments have been completed.`,
      notScheduledPhotoTooltip: (nextDay?: number) =>
        nextDay
          ? `Not scheduled for today · Next photo due Day ${nextDay}`
          : 'Photo assessment not scheduled for today',
      notScheduledBiomarkerNote: (name: string, currentDay: number) =>
        `${name} measurement is not scheduled for Day ${currentDay}.`,
      notScheduledBiomarkerTooltip: 'Metric not scheduled for today',
      scheduledTodayBadge: 'Scheduled Today',
      notScheduledBadge: 'Not Scheduled Today',
      baselineMockupSvgText: 'Day 1 baseline · vertex thinning',
      progressionMockupSvgText: 'Day 28 milestone · increased terminal density',
      baselineMockupSvg: (text: string) =>
        `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23f4f6f4"/><circle cx="300" cy="225" r="160" fill="%23dce3de" stroke="%232e3a34" stroke-width="2"/><ellipse cx="300" cy="210" rx="70" ry="80" fill="%23c2cdc5" opacity="0.85"/><text x="300" y="340" font-family="sans-serif" font-size="14" font-weight="500" text-anchor="middle" fill="%232e3a34" opacity="0.7">${text}</text><path d="M 270 200 Q 300 180 330 200" stroke="%232e3a34" stroke-width="1.5" fill="none" opacity="0.45"/><path d="M 280 220 Q 300 205 320 220" stroke="%232e3a34" stroke-width="1.5" fill="none" opacity="0.45"/></svg>`,
      progressionMockupSvg: (text: string) =>
        `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450" viewBox="0 0 600 450"><rect width="600" height="450" fill="%23edf2ee"/><circle cx="300" cy="225" r="160" fill="%23d5ded8" stroke="%232e3a34" stroke-width="2"/><ellipse cx="300" cy="210" rx="90" ry="100" fill="%239eafa3" opacity="0.95"/><text x="300" y="340" font-family="sans-serif" font-size="14" font-weight="500" text-anchor="middle" fill="%232e3a34" opacity="0.85">${text}</text><path d="M 255 190 Q 300 165 345 190" stroke="%232e3a34" stroke-width="2.5" fill="none" opacity="0.7"/><path d="M 265 210 Q 300 185 335 210" stroke="%232e3a34" stroke-width="2.5" fill="none" opacity="0.7"/><path d="M 275 230 Q 300 205 325 230" stroke="%232e3a34" stroke-width="2.5" fill="none" opacity="0.7"/></svg>`
    }
  },
  policyLedger: {
    dialogLabel: 'Clinical Guardrail Policy Ledger',
    title: 'Clinical Policy Ledger',
    firestoreLive: 'Firestore Live',
    memoryCache: 'Memory Hot Cache · Fail-Safe',
    versionFallback: 'Baseline',
    versionLabel: (version: string) => `Version ${version} · Google Cloud Firestore`,
    close: 'Close policy ledger',
    governanceBadge: 'Dynamic Runtime Governance',
    governanceDesc:
      'Policies resolve dynamically from Cloud Firestore across all Gemini extraction calls, Edge Gemma sessions, and client load-reduction triggers without container redeployment.',
    thresholdLabel: 'Adverse Escalation Threshold',
    thresholdDesc: 'Progression freezes when patient discomfort exceeds this level',
    thresholdDisplay: (threshold: number) => `${threshold} / 10`,
    mildLabel: '1 (mild)',
    severeLabel: '10 (severe)',
    reductionLabel: 'Recommended Load Reduction',
    reductionDesc: 'Training load / dose reduction applied when threshold is exceeded',
    reductionMinLabel: '10%',
    reductionMaxLabel: '50%',
    loadReductionDisplay: (reduction: number) => `${reduction}%`,
    bannedLabel: 'Automated Gatekeeper Banned Criteria',
    bannedDesc: 'Studies matching these keywords are immediately rejected by Gemini',
    syncActive: 'Live Cloud Firestore sync active',
    syncFallback: (status: string) => `Cloud Firestore ${status} (using hot memory ledger)`,
    resetBaseline: 'Reset baseline',
    cancel: 'Cancel',
    syncing: 'Syncing ledger…',
    saveSync: 'Save & sync policy',
    upToDate: 'Policy up to date',
    toastUpdated: 'Clinical guardrail policy ledger updated',
    toastUpdateError: 'Failed to update guardrail policy ledger',
    toastNetworkError: 'Network error updating policy ledger',
    toastReset: 'Guardrails reset to baseline clinical standards',
    toastResetError: 'Failed to reset guardrails'
  },
  api: {
    guardrails: {
      retrieveError: 'Failed to retrieve guardrail policy ledger status',
      invalidThreshold: 'painEscalationThreshold must be a number between 1 and 10',
      invalidReduction: 'loadReductionPercent must be a percentage between 5 and 90',
      updatedSuccess: 'Clinical guardrail policy ledger updated successfully',
      updateError: 'Failed to update guardrail policy',
      resetSuccess: 'Guardrail policy ledger reset to baseline clinical standards',
      resetError: 'Failed to reset guardrail policy'
    },
    assistant: {
      questionRequired: 'Question is required',
      internalError: 'Internal Server Error'
    },
    extract: {
      inputRequired: 'PDF file or paper URL/DOI is required',
      fileSizeExceeded: 'File size exceeds maximum limit of 20MB',
      invalidFormat: 'Invalid file format. Only PDF files are supported.',
      internalError: 'Internal Server Error during extraction'
    },
    tts: {
      invalidJson: 'Invalid JSON payload',
      textRequired: 'The "text" field is required and must be a non-empty string.',
      textExceeded: (max: number) => `Text length exceeds maximum allowed limit of ${max} characters.`,
      synthesisFailed: 'Failed to process speech synthesis request.'
    },
    userSync: {
      userIdRequired: 'User ID is required',
      internalError: 'Internal Server Error during user sync',
      fetchError: 'Internal Server Error fetching user sync'
    },
    papers: {
      fetchError: 'Internal Server Error fetching papers',
      saveError: 'Internal Server Error saving paper',
      paperRequired: 'Paper object is required',
      seedSuccess: 'Sample papers seeded successfully',
      saveSuccess: 'Paper saved to Firestore papers collection'
    },
    community: {
      protocolIdRequired: 'Routine ID is required',
      routineIdRequired: 'Routine ID is required',
      invalidOutcome: 'Outcome must be one of: improved, adjusted, paused',
      textRequired: 'Review text is required',
      saveSuccess: 'Community review recorded',
      fetchError: 'Failed to retrieve community data',
      saveError: 'Failed to save community review'
    }
  },
  fallbackProtocol: {
    phase: 'Phase 1: Week 1–2',
    phaseLabel: 'Week 1',
    authors: 'Research Collaborative & Clinical Investigators',
    journal: 'Journal of Interventional Human Science',
    trialType: 'Randomized Controlled Trial',
    step1Action: 'Primary Prescribed Intervention',
    step1Detail: 'Standardized experimental dosage/repetition routine under controlled observation.',
    step1Frequency: '1x Daily',
    step1SetLabel: 'Dose / round',
    step1PerSetLabel: '1 routine round',
    step1StatLabel: 'Target:',
    step1StatValue: '1 daily session',
    step2Action: 'Sustained Adaptation Hold',
    step2Detail:
      'Authors reported adaptation timing without specifying exact hold duration. Conservative 30s baseline applied.',
    step2Frequency: '1x Daily',
    progressionCondition: 'Compliance rate ≥ 85% with adverse symptom score ≤ 2/10 for 5 consecutive days',
    progressionAction: 'Progress load or duration by 10% in Phase 2',
    contraindicationText: 'Stop immediately if sharp acute discomfort or unexpected adverse symptoms occur.',
    missingParameter: 'Rest interval and hold duration',
    missingFallback: 'Conservative baseline: 3 × 30s with 60s recovery',
    metricName: 'tolerability',
    metricLabel: 'Symptom / tolerability',
    eyebrow: 'Symptom',
    logTitle: 'Log',
    dropOffUnit: 'day'
  },
  fallbackRoutine: {
    phase: 'Phase 1: Week 1–2',
    phaseLabel: 'Week 1',
    authors: 'Research Collaborative & Clinical Investigators',
    journal: 'Journal of Interventional Human Science',
    trialType: 'Randomized Controlled Trial',
    step1Action: 'Primary Prescribed Intervention',
    step1Detail: 'Standardized experimental dosage/repetition routine under controlled observation.',
    step1Frequency: '1x Daily',
    step1SetLabel: 'Dose / round',
    step1PerSetLabel: '1 routine round',
    step1StatLabel: 'Target:',
    step1StatValue: '1 daily session',
    step2Action: 'Sustained Adaptation Hold',
    step2Detail:
      'Authors reported adaptation timing without specifying exact hold duration. Conservative 30s baseline applied.',
    step2Frequency: '1x Daily',
    progressionCondition: 'Compliance rate ≥ 85% with adverse symptom score ≤ 2/10 for 5 consecutive days',
    progressionAction: 'Progress load or duration by 10% in Phase 2',
    contraindicationText: 'Stop immediately if sharp acute discomfort or unexpected adverse symptoms occur.',
    missingParameter: 'Rest interval and hold duration',
    missingFallback: 'Conservative baseline: 3 × 30s with 60s recovery',
    metricName: 'tolerability',
    metricLabel: 'Symptom / tolerability',
    eyebrow: 'Symptom',
    logTitle: 'Log',
    dropOffUnit: 'day'
  },
  howTo: {
    buttonLabel: 'How to use & trending papers',
    buttonShort: 'How to',
    buttonExploreSamples: 'Explore trending papers',
    dialogLabel: 'How to use ViskotuN1 & trending research papers',
    title: 'How ViskotuN1 Works',
    eyebrow: 'User guide & trending clinical research papers',
    badge: 'Interactive Research Pipeline',
    intro:
      'ViskotuN1 converts dense, peer-reviewed human interventional research into executable daily routines with zero hallucinated gaps and an evidence-grounded AI safety assistant.',
    tabs: {
      guide: 'How it works',
      samples: 'Trending papers',
      scope: 'Accepted papers'
    },
    steps: [
      {
        step: '01',
        title: 'Ingest Research PDF',
        description:
          'Upload any peer-reviewed clinical trial (RCT) or human interventional paper. Gemini Multimodal analyzes the Methods and Outcomes sections to extract dosing, tempo, sets, and contraindications.'
      },
      {
        step: '02',
        title: 'Morphing UI Generation',
        description:
          'The paper constructs its own interface: milestone photos for dermatology, reaction timers for cognitive trials, and numeric biomarker steppers for blood glucose or blood pressure.'
      },
      {
        step: '03',
        title: 'Adaptive Safety & Biofeedback',
        description:
          'Track daily sets and log adverse tolerability. Escalation automatically freezes and recommends load reductions when discomfort thresholds are exceeded in the Firestore Guardrail Ledger.'
      }
    ],
    samplesTitle: 'Trending Clinical Research Papers',
    trendingTitle: 'Trending Clinical Research Papers',
    samplesSubtitle:
      'Explore top-ranked clinical research papers in our database with real-time community participants, compliance tracking, and verified biofeedback telemetry.',
    trendingSubtitle:
      'Explore top-ranked clinical research papers in our database with real-time community participants, compliance tracking, and verified biofeedback telemetry.',
    firestoreSyncLive: 'Firebase Firestore live',
    firestoreSyncLocal: 'Local verified catalog',
    filterByTopic: 'Filtered by:',
    clearFilter: 'Clear topic filter',
    loadButton: 'Start this routine',
    loadedButton: 'Active in workspace',
    downloadPdfButton: 'Download Open-Access PDF',
    doiLabel: 'View on PMC / DOI',
    loadedToast: (title: string) => `Started tracking "${title}" on Day 1`,
    trendingRankBadge: (rank: number) => `#${rank} Trending`,
    activeTrackersBadge: (count: number) =>
      `${count.toLocaleString()} ${count === 1 ? 'active tracker' : 'active trackers'}`,
    totalLogsBadge: (count: number) =>
      `${count.toLocaleString()} ${count === 1 ? 'log' : 'logs'}`,
    featuresHeader: 'Trial Endpoints & Morphing UI Tested:',
    scopeTitle: 'Strict Gatekeeper Scope',
    scopeSubtitle:
      'ViskotuN1 specializes strictly in Interventional Human Science. Theoretical topics and non-human animal models are safely rejected.',
    acceptedHeader: 'Accepted Topics (Eligible)',
    acceptedList: [
      'Musculoskeletal & physical therapy rehabilitation routines',
      'Pharmacological and nutritional human clinical trials',
      'Sleep scheduling, light therapy & circadian hygiene',
      'Dermatology and topical regenerative regimens',
      'Cardiorespiratory and exercise prescription studies'
    ],
    rejectedHeader: 'Rejected Topics (Auto-Declined by Gatekeeper)',
    rejectedList: [
      'Preclinical animal studies (mice, rats, rodents, rabbits)',
      'In vitro assays, cell cultures, and petri dish experiments',
      'Theoretical physics, mathematics, cosmology, quantum theory',
      'Macroeconomics, finance, and non-health computer science',
      'Purely observational surveys lacking an actionable intervention'
    ],
    testGatekeeperTitle: 'Test AI Safety Gatekeeper',
    testGatekeeperSubtitle:
      'Download this preclinical rodent study PDF to verify that our Guardrail Ledger immediately detects and declines non-human research with an educational clinical notice.',
    testGatekeeperBadge: 'Intentional Rejection Test'
  },
  onboarding: {
    welcomeEyebrow: 'Getting started',
    welcomeTitle: 'Turn clinical research into daily routines',
    welcomeSubtitle:
      'ViskotuN1 ingests peer-reviewed clinical research and transforms it into executable, adaptive daily health routines. Start fresh with your own research PDF or pick from top trending clinical papers in our database.',
    ctaUpload: 'Upload research paper',
    ctaHowTo: 'How to & trending papers',
    dropPrompt: 'Drop a research PDF here to extract',
    dropSubtext: 'Clinical trials, RCTs, rehabilitation, nutrition, sleep & pharmacology',
    samplesHeading: 'Get started with these trending research papers:',
    trendingHeading: 'Get started with these trending research papers:',
    viewAllTrending: 'Explore all trending papers',
    quickLoadButton: 'Start routine',
    noActiveProtocol: 'No active routine',
    noActiveRoutine: 'No active routine',
    noActiveProtocolDesc: 'Upload a research paper or choose a trending clinical paper to start tracking.',
    noActiveRoutineDesc: 'Upload a research paper or choose a trending clinical paper to start tracking.'
  }
} as const;