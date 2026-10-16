import { LOAD_REDUCTION_PERCENT } from './config';

/** Centralized UI copy. Protocol-specific content lives in data/protocols. */
export const COPY = {
  brand: {
    mark: '//',
    name: 'protocol engine'
  },
  greeting: {
    morning: 'morning,',
    afternoon: 'afternoon,',
    evening: 'evening,'
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
    today: 'today',
    stats: 'stats',
    community: 'community'
  },
  shell: {
    streak: (days: number) => `🔥 ${days} day streak`,
    addPaper: 'Add new paper',
    openAssistant: 'Open paper assistant',
    resetDemo: 'reset to demo defaults',
    assistantFab: (title: string) => `ask about ${title} or drop a pdf`,
    todaySummaryLabel: "Today's progress",
    dayOfTotal: (day: number, total: number) => `day ${day} / ${total}`,
    dropTitle: 'drop to extract',
    dropSubtitle: "we'll isolate the methods & build a protocol",
    dropScope: 'interventional human research · clinical trials, RCTs & behavioral protocols'
  },
  switcher: {
    heading: 'your papers',
    addPaper: 'add new paper',
    meta: (day: number, total: number, percent: number) => `day ${day}/${total} · ${percent}% today`
  },
  papers: {
    queuedNote: 'extracting protocol…'
  },
  routine: {
    eyebrow: (day: number, total: number) => `day ${day} of ${total}`,
    title: (percent: number) => `${percent}% complete`,
    progressLabel: 'Daily progress',
    historyEyebrow: 'protocol',
    historyTitle: 'history',
    openDashboard: 'Open dashboard',
    feedbackEyebrow: 'feedback',
    feedbackTitle: 'log',
    metricEyebrow: (name?: string) => name || 'feedback',
    metricTitle: (title?: string) => title || 'log',
    feedbackDay: (day: number) => `day ${day}`,
    noNotes: 'no notes',
    emptyFeedbackTitle: 'no feedback logged yet',
    emptyMetricTitle: (name?: string) => (name ? `no ${name} logged yet` : 'no feedback logged yet'),
    emptyFeedbackBody: 'log how you feel after each session so the protocol can adapt.',
    emptyStepsTitle: 'no steps extracted',
    emptyStepsBody: 'this paper did not report an executable routine.'
  },
  dayActions: {
    markComplete: 'mark today complete',
    dayLogged: (day: number) => `✓ day ${day} logged`,
    logFeedback: (name?: string) => (name ? `log ${name}` : 'log feedback')
  },
  safety: {
    escalationAlert: `Feedback threshold exceeded. Escalation paused. Recommendation: Reduce load/dose by ${LOAD_REDUCTION_PERCENT}% tomorrow or consult a specialist.`,
    dynamicEscalationAlert: (name?: string, customMessage?: string) =>
      customMessage ||
      `${name ? name.charAt(0).toUpperCase() + name.slice(1) : 'Symptom'} threshold exceeded. Escalation paused. Recommendation: Reduce load/dose by ${LOAD_REDUCTION_PERCENT}% tomorrow or consult your specialist.`,
    escalationShort: `escalation paused — load/dose reduced ${LOAD_REDUCTION_PERCENT}% for tomorrow`,
    pausedRecommendation: `Paused — reduce load/dose by ${LOAD_REDUCTION_PERCENT}% tomorrow.`
  },
  calendar: {
    listLabel: 'Protocol day history',
    range: (start: number, end: number, total: number) => `days ${start}–${end} of ${total}`,
    upcoming: (day: number) => `Day ${day}, upcoming`,
    progress: (day: number, percent: number) => `Day ${day}, ${percent}% complete`,
    legend: {
      complete: 'complete',
      partial: 'partial',
      today: 'today'
    }
  },
  severityLevels: {
    mild: 'mild',
    moderate: 'moderate',
    severe: 'severe'
  },
  feedbackDrawer: {
    dialogLabel: 'Log subjective feedback',
    metricDialogLabel: (name?: string) => `Log ${name || 'feedback or side effect'}`,
    close: 'Close',
    header: (day: number) => `feedback · day ${day}`,
    metricHeader: (name: string, day: number) => `${name} · day ${day}`,
    decrease: 'Decrease score',
    decreaseMetric: (name: string) => `Decrease ${name} score`,
    increase: 'Increase score',
    increaseMetric: (name: string) => `Increase ${name} score`,
    ofMax: (max: number) => `of ${max}`,
    sliderLabel: (min: number, max: number) => `Score scale from ${min} to ${max}`,
    metricSliderLabel: (name: string, min: number, max: number) => `${name} scale from ${min} to ${max}`,
    sliderValue: (score: number, max: number, level: string) => `${score} out of ${max}, ${level}`,
    minLabel: (min: number) => `${min} · none`,
    maxLabel: (max: number) => `${max} · severe`,
    notesLabel: 'Notes',
    notesPlaceholder: 'Optional notes for AI adjustment...',
    save: 'save log to protocol',
    saved: 'log saved to your protocol',
    savedMetric: (name?: string) => `${name || 'feedback'} saved to your protocol`
  },
  task: {
    complete: (action: string) => `Complete ${action}`,
    uncheck: (action: string) => `Uncheck ${action}`,
    decrease: (action: string) => `Decrease progress for ${action}`,
    increase: (action: string) => `Increase progress for ${action}`,
    counterLabel: (action: string) => `Progress counter for ${action}`,
    frequency: 'frequency:',
    source: 'source:',
    sourcePaper: 'paper',
    sourceDefaulted: 'defaulted',
    inferredMarker: ' *',
    inferredNote: '* parameter not reported by authors — conservative clinical default applied',
    defaultSetLabel: 'sets',
    holdStatLabel: 'hold:',
    repsStatLabel: 'reps:',
    targetStatLabel: 'target:',
    perSetHold: (seconds: number) => `× ${seconds}s hold`,
    perSetReps: (reps: number) => `× ${reps} reps`,
    holdValue: (seconds: number) => `${seconds}s`,
    holdSummary: (seconds: number) => `${seconds}s hold`,
    repsSummary: (reps: number) => `${reps} reps`
  },
  protocolCard: {
    label: 'Extracted protocol',
    eyebrow: (phase: string) => `extracted · ${phase}`,
    title: 'your protocol',
    openRoutine: "Open today's routine",
    defaulted: ' · defaulted',
    rulePrefix: 'rule: if',
    ruleArrow: '→'
  },
  missingData: {
    caution: 'Caution: The authors omitted exact dosing or execution parameters for',
    fallback: 'System defaulted to conservative baseline parameters.'
  },
  dashboard: {
    eyebrow: 'track',
    title: 'your experiments',
    metricsLabel: 'Key metrics',
    activeProtocol: 'active protocol',
    adherence: 'adherence',
    currentPhase: 'current phase',
    evidenceScore: 'evidence score',
    evidenceCaption: (trial: string, sampleSize: number) => `${trial} · N = ${sampleSize}`,
    compliance: {
      high: 'high compliance',
      moderate: 'moderate',
      low: 'low'
    },
    phase: {
      paused: 'escalation paused',
      ready: 'progression trigger ready',
      holding: 'holding current phase'
    },
    papersLabel: 'All papers',
    papersEyebrow: 'all',
    papersTitle: 'papers',
    paperMeta: (day: number, total: number, streak: number) => `day ${day}/${total} · 🔥 ${streak} days`,
    activeSuffix: ' · active',
    sourcePaper: 'source paper',
    emptyPapersTitle: 'no papers yet',
    emptyPapersBody: 'drop a research pdf to extract your first protocol.',
    progressionEyebrow: 'next step',
    progressionTitle: 'progression',
    progressionHolding: 'Holding until the progression rule threshold is met.',
    progressionReady: (condition: string, action: string) => `${condition}. ${action}.`
  },
  evidence: {
    rctShort: 'rct',
    pilotShort: 'pilot',
    high: 'high',
    moderate: 'moderate'
  },
  shareableSummary: {
    eyebrow: 'shareable',
    title: 'protocol summary',
    cardTitle: '1-page brief',
    body: (title: string) =>
      `1-page brief of ${title}: trial citation, daily routine, adherence rate, and logs to share with your coach, specialist, or personal records.`,
    export: '📄 view & print 1-page summary',
    exporting: 'preparing 1-page summary…',
    success: '✓ 1-page summary ready',
    successToast: 'shareable summary generated',
    error: "We couldn't generate the summary. Check your connection and try again.",
    errorToast: 'export failed',
    retry: 'try again',
    printButton: 'print / save as pdf',
    closeButton: 'close',
    disclaimer:
      'Protocol Engine translates human interventional research into structured daily routines. This summary is intended for personal tracking, coaching, or clinical review and does not constitute medical advice.',
    trialCitation: 'study citation & methodology',
    adherenceAndStreak: 'adherence & progression',
    prescribedRoutine: 'prescribed routine & methods',
    safetyAndRules: 'safety rules & contraindications',
    recentLogs: 'recent biofeedback logs',
    noLogsYet: 'no daily logs recorded yet',
    generatedOn: (date: string) => `generated on ${date}`,
    dialogLabel: 'Shareable Protocol Summary and Progress Brief'
  },
  voiceCoach: {
    eyebrow: 'hands-free',
    title: 'voice coach',
    listening: 'coaching active',
    idle: 'hands-free audio guidance',
    play: 'start voice coach',
    pause: 'pause voice coach',
    resume: 'resume voice coach',
    stepPacing: (current: number, total: number) => `step ${current} of ${total}`,
    nextStep: 'next step',
    prevStep: 'previous step',
    speed: (rate: number) => `${rate}x speed`,
    soundOn: 'sound cues on',
    soundMuted: 'sound cues muted',
    countdown: (seconds: number) => `hold: ${seconds}s`,
    countdownComplete: 'hold complete',
    countdownActive: (seconds: number) => `${seconds}s hold timer running`,
    stepAnnouncement: (stepNum: number, total: number, title: string, details: string) =>
      `Step ${stepNum} of ${total}: ${title}. ${details}`,
    safetyReminder: (rule: string) => `Safety reminder: ${rule}`,
    holdCountdownStart: (seconds: number) => `Begin hold for ${seconds} seconds. 3, 2, 1, start.`,
    holdFinished: 'Hold complete. Relax.',
    finishedAllSteps: 'Great work! You have completed all prescribed protocol steps for today.',
    unsupported: 'Voice synthesis is not supported on this browser.'
  },
  community: {
    eyebrow: 'community',
    title: 'evidence insights',
    comparisonLabel: 'Paper versus reality',
    studyEfficacy: 'study reported efficacy',
    studyCaption: (sampleSize: number) => `lab · N = ${sampleSize}`,
    realWorldEfficacy: 'real-world app efficacy',
    realWorldCaption: (users: string) => `based on ${users} users`,
    dropOffLabel: 'Common drop-off points',
    dropOffEyebrow: 'drop-off',
    hardestDays: 'hardest days',
    hardestWeeks: 'hardest weeks',
    peak: (unit: string, period: number) => `${unit} ${period} peak`,
    periodLabel: (unit: string, period: string | number) => `${unit} ${period}`,
    dropOffValue: (value: number) => `${value}% drop-off`,
    emptyChart: 'not enough community data yet',
    reviewsLabel: 'User outcome reviews',
    reviewsEyebrow: 'user',
    reviewsTitle: 'outcome reviews',
    filterLabel: 'Filter reviews by outcome',
    filters: {
      all: 'all',
      improved: 'improved',
      adjusted: 'adjusted',
      paused: 'paused'
    },
    reviewMeta: (outcome: string, day: number) => `${outcome} · day ${day}`,
    reviewAdherence: (adherence: number) => `${adherence}% adherence`,
    emptyReviews: 'no logs match this filter yet'
  },
  badges: {
    rct: 'RCT gold standard',
    pilot: 'pilot trial',
    missingParameters: '⚠ missing parameters'
  },
  assistant: {
    dialogLabel: 'Paper assistant',
    close: 'Close assistant',
    modeLabel: 'Assistant mode',
    modes: {
      ask: 'ask',
      upload: 'add paper'
    },
    eyebrowUpload: 'new research',
    titleAsk: 'ask your paper',
    titleUpload: 'add a paper',
    typing: 'Assistant is typing',
    attach: 'Attach a PDF',
    send: 'Send',
    inputAsk: 'Ask about this paper',
    inputUpload: 'Paste a DOI or PubMed link',
    placeholderAsk: 'ask about this paper…',
    placeholderUpload: 'paste a doi or pubmed link…',
    suggestionsLabel: 'Suggested questions',
    emptyTitle: 'no messages yet',
    emptyBody: 'ask about dosing, frequency, safety or progression.',
    answerSource: 'source · methods section',
    engines: {
      onDeviceGemma: '⚡ On-Device Gemma',
      cloudGemini: '☁️ Gemini Flash',
      serverGemma: '⚡ Gemma 2 Endpoint',
      localRules: '🔒 Deterministic Matcher',
      onDeviceBadge: 'on-device (0ms · private)',
      cloudBadge: 'cloud AI',
      localBadge: 'offline matcher',
      activeEngineLabel: 'ai engine:'
    },
    backToToday: 'back to today',
    meta: {
      sample: 'sample:',
      design: 'design:',
      year: 'year:',
      sampleValue: (sampleSize: number) => `N = ${sampleSize}`
    },
    noAnswer: (title: string) =>
    `I couldn't find that in the Methods section of this paper. Try asking about dosing, frequency, safety or progression for ${title}.`,
    confirmLogged: (day: number, score: number) =>
    `Logged Day ${day}. Biofeedback score ${score}/10. Ready for tomorrow's target.`,
    confirmSafe: (day: number, score: number) =>
    `Logged Day ${day}. Biofeedback score ${score}/10. Within the study's safe range — progression stays on track.`
  },
  processing: {
    queued: 'extraction queued',
    extracting: 'extracting',
    stages: [
    'reading the paper',
    'isolating methods & interventions',
    'checking for missing parameters',
    'building your protocol draft'],

    ready:
    "Draft ready for review. It'll appear in your papers once you confirm the extracted parameters."
  },
  upload: {
    title: 'drop a research pdf',
    body: 'or paste a doi / pubmed link below · methods only, no hallucinated gaps',
    browse: 'browse files',
    invalidType: 'only pdf files are supported — please choose a .pdf',
    scopeBadge: 'human interventional studies only',
    scopeNote:
      'Studies where researchers applied a measurable protocol to human participants (clinical rehab, pharmacology, sleep, nutrition, cognitive habits). Non-human or theoretical papers without an executable protocol will be declined.'
  },
  extraction: {
    title: 'protocol extraction',
    parsing: 'analyzing paper with Gemini 1.5...',
    success: 'protocol successfully extracted and activated',
    declinedTitle: 'paper declined by gatekeeper',
    declinedPrefix: 'Declined: ',
    declinedNonHuman:
      'This study appears to be non-human (in vitro or animal model) or purely observational. Protocol Engine only builds executable protocols from interventional studies conducted on human participants.',
    declinedTheoretical:
      'This paper appears to be theoretical physics, mathematics, or cosmology without human subject testing. Protocol Engine is specialized for human clinical, rehabilitation, and lifestyle interventions.',
    errorTitle: 'extraction failed',
    errorGeneral:
      'Could not extract a protocol from this document. Please verify it is an interventional study or try another PDF.'
  },
  landing: {
    badge: 'google ai builder cup · media & digital experiences',
    heroEyebrow: 'evidence into action',
    heroTitle: 'Transform clinical trials into executable daily routines.',
    heroSubtitle:
      'Protocol Engine converts dense, peer-reviewed human interventional research into adaptive daily protocols with zero hallucinated gaps and an evidence-grounded AI safety assistant.',
    ctaGuest: 'try as guest (instant demo)',
    ctaLogin: 'sign in with account',
    ctaSignup: 'create account',
    scopeBadge: 'strictly interventional human research',
    scopeNote:
      'We validate clinical trials, rehabilitation protocols, nutrition, sleep, and pharmacology. Pure theory, non-human animal models, and observational studies are safely filtered out.',
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
    demoSubtitle: 'Drop a research PDF or explore pre-loaded clinical protocols with zero setup.'
  },
  auth: {
    loginTitle: 'welcome back',
    loginSubtitle: 'sign in to access your persistent protocols and saved research history.',
    signupTitle: 'create your account',
    signupSubtitle: 'save and sync extracted research papers and daily progress across devices.',
    nameLabel: 'your full name',
    namePlaceholder: 'e.g. Dr. Jane Smith',
    emailLabel: 'email address',
    emailPlaceholder: 'you@example.com',
    passwordLabel: 'password',
    passwordPlaceholder: '••••••••',
    loginButton: 'sign in',
    signupButton: 'create account',
    googleButton: 'continue with google',
    guestButton: 'continue as guest (no sign-up required)',
    guestNotice: 'guest mode stores protocols locally in your browser. sign in anytime to sync to the cloud.',
    haveAccount: 'already have an account? sign in',
    needAccount: "don't have an account? create one",
    signOut: 'sign out',
    guestBadge: 'guest mode',
    saveNotice: 'sign in to sync your papers to the cloud',
    orWithEmail: 'or with email',
    toastValidEmail: 'please enter a valid email address.',
    toastWelcomeBack: 'welcome back!',
    toastAccountCreated: 'account created successfully!',
    toastAuthFailed: 'authentication failed. please try again.',
    toastGoogleSuccess: 'signed in with google!',
    toastGoogleFailed: 'google sign-in failed.',
    toastGuestEntered: 'entered as guest explorer'
  },
  errors: {
    boundaryTitle: 'something went wrong',
    boundaryBody: 'this view failed to load. your logs are safe.',
    retry: 'reload view',
    noProtocolsTitle: 'no protocols available',
    noProtocolsBody: 'add a research paper to get started.'
  },
  demo: {
    resetSuccess: 'reset to demo defaults — storage cleared'
  },
  morphing: {
    dialogTitle: (name: string, day: number) => `${name} · day ${day}`,
    milestoneTag: 'Milestone Assessment',
    dailyTag: 'Daily Metric',
    saveEntry: 'Save measurement to protocol',
    savedToast: (name: string) => `${name} recorded successfully`,
    widgets: {
      photo: {
        uploadPrompt: 'Capture or upload clinical photograph',
        dropHint: 'Drag & drop image file or click to select',
        changePhoto: 'Change photo',
        retake: 'Retake',
        instructionsLabel: 'Standardized study protocol guidelines:',
        previewAlt: 'Milestone clinical assessment photo'
      },
      numeric: {
        enterValue: 'Measured value',
        referenceRange: (min?: number, max?: number, unit?: string) =>
          `Target range: ${min ?? 0}–${max ?? 100} ${unit || ''}`
      },
      timer: {
        start: 'Start test timer',
        pause: 'Pause',
        reset: 'Reset',
        complete: 'Test complete!',
        targetDuration: (seconds: number) => `Target duration: ${seconds}s`
      },
      multichoice: {
        selectOne: 'Select clinical classification:'
      },
      boolean: {
        yes: 'Yes, present',
        no: 'No, absent'
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
      gridToggle: 'standardization grid',
      noMilestonesYet: 'No milestone evaluations completed yet',
      currentReading: (val: number | string, unit?: string) => `Current: ${val} ${unit || ''}`.trim(),
      targetReference: (target: string) => `Target: ${target}`
    }
  },
  policyLedger: {
    dialogLabel: 'Clinical Guardrail Policy Ledger',
    title: 'Clinical Policy Ledger',
    firestoreLive: 'Firestore Live',
    memoryCache: 'Memory Hot Cache · Fail-Safe',
    versionLabel: (version: string) => `version ${version} · Google Cloud Firestore`,
    close: 'Close policy ledger',
    governanceBadge: 'Dynamic Runtime Governance',
    governanceDesc:
      'Policies resolve dynamically from Cloud Firestore across all Gemini extraction calls, Edge Gemma sessions, and client load-reduction triggers without container redeployment.',
    thresholdLabel: 'Adverse Escalation Threshold',
    thresholdDesc: 'Progression freezes when patient discomfort exceeds this level',
    mildLabel: '1 (mild)',
    severeLabel: '10 (severe)',
    reductionLabel: 'Recommended Load Reduction',
    reductionDesc: 'Training load / dose reduction applied when threshold is exceeded',
    reductionMinLabel: '10%',
    reductionMaxLabel: '50%',
    bannedLabel: 'Automated Gatekeeper Banned Criteria',
    bannedDesc: 'Studies matching these keywords are immediately rejected by Gemini',
    syncActive: 'Live Cloud Firestore sync active',
    syncFallback: (status: string) => `Cloud Firestore ${status} (using hot memory ledger)`,
    resetBaseline: 'reset baseline',
    cancel: 'cancel',
    syncing: 'syncing ledger…',
    saveSync: 'save & sync policy',
    upToDate: 'policy up to date',
    toastUpdated: 'Clinical guardrail policy ledger updated',
    toastUpdateError: 'Failed to update guardrail policy ledger',
    toastNetworkError: 'Network error updating policy ledger',
    toastReset: 'Guardrails reset to baseline clinical standards',
    toastResetError: 'Failed to reset guardrails'
  }
} as const;