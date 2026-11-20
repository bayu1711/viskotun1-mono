import type { DeepPartial, LocaleCopy } from './types';

/**
 * Arabic for the copy sections that `ar.ts` did not cover yet (task cards, voice coach
 * labels, Stats, the shareable summary, Community, the assistant, landing, auth, How-to,
 * morphing widgets and the admin ledger). Merged after `COPY_AR_OVERRIDE` in `index.ts`.
 *
 * Deliberately left in English:
 * - Voice-coach spoken lines (`voiceCoach.script`, announcements): the coach speaks with an
 *   English voice, and an English voice reading Arabic text is unintelligible.
 * - Image data URIs, asset URLs and demo account names.
 */
export const COPY_AR_COMPLETION: DeepPartial<LocaleCopy> = {
  dayActions: {
    simulateFullCompletionToast: (title, days) => `تمت محاكاة التجربة البحثية الكاملة لـ ${title} (${days} يوماً)`,
    simulatedFullCompletionToast: (title, days) => `تمت محاكاة التجربة البحثية الكاملة لـ ${title} (${days} يوماً)`
  },
  feedbackDrawer: {
    defaultMetricName: 'التقييم',
    defaultMetric: {
      name: 'المؤشر الحيوي',
      label: 'درجة الأعراض / الجهد',
      eyebrow: 'التقييم',
      logTitle: 'سجّل حالتك',
      minLabel: '0 · لا شيء',
      maxLabel: '10 · شديد'
    },
    metricDialogLabel: (name) => `تسجيل ${name || 'تقييم أو عرض جانبي'}`,
    metricHeader: (name, day) => `${name} · اليوم ${day}`,
    decrease: 'خفض الدرجة',
    decreaseMetric: (name) => `خفض درجة ${name}`,
    increase: 'رفع الدرجة',
    increaseMetric: (name) => `رفع درجة ${name}`,
    ofMax: (max) => `من ${max}`,
    sliderLabel: (min, max) => `مقياس الدرجة من ${min} إلى ${max}`,
    metricSliderLabel: (name, min, max) => `مقياس ${name} من ${min} إلى ${max}`,
    sliderValue: (score, max, level) => `${score} من ${max}، ${level}`,
    savedMetric: (name) => `تم حفظ ${name || 'التقييم'} في خطتك`
  },
  task: {
    decrease: (action) => `خفض التقدم في ${action}`,
    increase: (action) => `زيادة التقدم في ${action}`,
    counterLabel: (action) => `عداد التقدم لـ ${action}`,
    source: 'المصدر:',
    sourcePaper: 'الورقة',
    sourceDefaulted: 'قيمة افتراضية',
    inferredNote: '* لم يذكر المؤلفون هذه القيمة — طُبّقت قيمة سريرية افتراضية متحفظة',
    inferredBadge: (source) => (source ? `مُستنتج · ${source}` : 'خط أساس مُستنتج'),
    tempoBadge: (tempo) => `الإيقاع · ${tempo}`,
    lineageBadge: (source) => (source ? `مرجع سابق · ${source}` : 'مرجع سابق'),
    excludeStep: 'استبعاد الخطوة',
    restoreStep: 'استعادة الخطوة',
    excludedBadge: 'مستبعدة',
    microBadge: 'مصغّرة',
    pendingCheckinTitle: 'متابعة العودة بانتظارك',
    excludedNote: 'مستبعدة من الخطة اليومية — لا تؤثر في حلقة التقدم أو الاستمرارية',
    defaultSetLabel: 'مجموعات',
    holdStatLabel: 'الثبات:',
    repsStatLabel: 'التكرارات:',
    targetStatLabel: 'الهدف:',
    perSetHold: (seconds) => `× ثبات ${seconds} ث`,
    perSetReps: (reps) => `× ${reps} تكرار`,
    singleUnitPerSet: (label) => `× 1 ${label}`,
    singleUnitStat: (label) => `1 ${label}`,
    holdValue: (seconds) => `${seconds} ث`,
    holdSummary: (seconds) => `ثبات ${seconds} ث`,
    repsSummary: (reps) => `${reps} تكرار`,
    helpAriaLabel: (action) => `تعليمات مفصلة لـ ${action}`,
    helpTooltip: (action) => `كيفية أداء ${action} · اسأل N1`
  },
  routineCard: {
    label: 'الخطة المستخرجة',
    eyebrow: (phase) => `مستخرجة · ${phase}`,
    title: 'خطتك',
    openRoutine: 'افتح خطة اليوم',
    defaulted: ' · قيمة افتراضية',
    rulePrefix: 'القاعدة: إذا'
  },
  missingData: {
    caution: 'تنبيه: لم يذكر المؤلفون الجرعة أو معايير التنفيذ الدقيقة لـ',
    fallback: 'طبّق النظام قيماً أساسية متحفظة.',
    stepOmissionNotice: (param) => `غير مذكور في الورقة: ${param}`,
    candidateExclusionNotice: 'مستبعدة من الخطة — لن تُجدول في اليوم الأول',
    missingDataTitle: 'معايير ناقصة في التجربة'
  },
  dashboard: {
    eyebrow: 'المتابعة',
    title: 'تقدّمك في N1',
    metricsLabel: 'المؤشرات الرئيسية',
    activeRoutine: 'الخطة النشطة',
    adherence: 'الالتزام',
    currentPhase: 'المرحلة الحالية',
    evidenceScore: 'قوة الدليل',
    evidenceCaption: (trial, sampleSize) => `${trial} · N = ${sampleSize}`,
    compliance: {
      high: 'التزام مرتفع',
      moderate: 'متوسط',
      low: 'منخفض'
    },
    phase: {
      paused: 'التصعيد متوقف',
      ready: 'شرط التقدم مستوفى',
      holding: 'ثبات على المرحلة الحالية'
    },
    papersLabel: 'كل الأوراق',
    papersEyebrow: 'الكل',
    papersTitle: 'الأوراق',
    paperMeta: (day, total) => `اليوم ${day}/${total}`,
    activeSuffix: ' · نشطة',
    sourcePaper: 'الورقة المصدر',
    emptyPapersTitle: 'لا توجد أوراق بعد',
    emptyPapersBody: 'أسقط ملف PDF لبحث لاستخراج أول خطة لك.',
    progressionEyebrow: 'الخطوة التالية',
    progressionTitle: 'التقدّم',
    progressionHolding: 'ثبات حتى يتحقق شرط قاعدة التقدم.',
    progressionHoldingRule: (condition, action) => `ثبات حتى تتحقق القاعدة: إذا ${condition.replace(/^if\s+/i, '')}، ${action}.`,
    progressionReady: (condition, action) => `${condition}. ${action}.`
  },
  evidence: {
    rctShort: 'تجربة عشوائية',
    pilotShort: 'تجريبية',
    high: 'مرتفعة',
    moderate: 'متوسطة'
  },
  shareableSummary: {
    eyebrow: 'للمشاركة',
    title: 'ملخص الخطة',
    cardTitle: 'موجز من صفحة واحدة',
    body: (title) => `موجز من صفحة واحدة لـ ${title}: مرجع التجربة، والخطة اليومية، ونسبة الالتزام، والسجلات لمشاركتها مع مدربك أو أخصائيك أو لسجلاتك الشخصية.`,
    export: 'عرض وطباعة ملخص من صفحة واحدة',
    exporting: 'جارٍ تجهيز الملخص…',
    success: 'الملخص جاهز',
    successToast: 'تم إنشاء الملخص القابل للمشاركة',
    error: 'تعذّر إنشاء الملخص. تحقّق من اتصالك وحاول مرة أخرى.',
    errorToast: 'فشل التصدير',
    retry: 'حاول مرة أخرى',
    printButton: 'طباعة / حفظ كملف PDF',
    closeButton: 'إغلاق',
    disclaimer: 'يحوّل TrialN1 الأبحاث التدخلية على البشر إلى خطط يومية منظمة. هذا الملخص مخصص للمتابعة الشخصية أو التدريب أو المراجعة السريرية، ولا يُعد نصيحة طبية.',
    trialCitation: 'مرجع الدراسة ومنهجيتها',
    adherenceAndStreak: 'الالتزام والتقدم',
    prescribedRoutine: 'الخطة الموصوفة والطرق',
    safetyAndRules: 'قواعد السلامة وموانع الاستعمال',
    recentLogs: 'أحدث سجلات المؤشرات الحيوية',
    noLogsYet: 'لا توجد سجلات بعد.',
    generatedOn: (date) => `أُنشئ في ${date}`,
    dialogLabel: 'ملخص الخطة القابل للمشاركة وموجز التقدم',
    timelineProgress: 'التقدم الزمني',
    adherenceRate: 'نسبة الالتزام',
    consistencyStreak: 'أيام الاستمرارية',
    progressionGate: 'بوابة التقدم',
    statusPaused: 'التصعيد متوقف',
    statusReady: 'جاهز للتقدم',
    statusHolding: 'ثبات على الحمل',
    conservativeBaseline: 'خط أساس متحفظ',
    progressionRuleHeading: 'قاعدة التقدم',
    safetyRulesHeading: 'قواعد السلامة والتوقف',
    conditionLabel: 'الشرط:',
    actionLabel: 'الإجراء:',
    standardDurationFallback: 'اتبع المدة السريرية المعيارية.',
    stopImmediatelyIf: 'توقف فوراً إذا:',
    standardMonitoringFallback: 'متابعة سريرية معيارية؛ توقّف عند حدوث انزعاج شديد.',
    dayUnit: (count) => (count === 1 ? 'يوم' : 'أيام'),
    sampleSize: (sampleSize) => `حجم العينة: N = ${sampleSize}`,
    dayRatio: (current, total) => `اليوم ${current} / ${total}`,
    briefBadge: 'موجز الخطة للمشاركة',
    phasePrefix: 'المرحلة:',
    studyYear: (year) => `سنة الدراسة: ${year}`,
    doi: (doi) => `DOI: ${doi}`,
    dayValue: (day) => `اليوم ${day}`,
    totalDaysValue: (total) => `/ ${total}`,
    logScoreMeta: (day, score) => `اليوم ${day} · الدرجة ${score}/10`,
    footerAudit: (doi) => `TrialN1 • علوم تدخلية على البشر • المصدر: ${doi}`
  },
  shareModal: {
    openShareTitle: 'مشاركة الخطة ورمز QR'
  },
  voiceCoach: {
    eyebrow: 'دون استخدام اليدين',
    title: 'المدرب الصوتي',
    listening: 'التدريب الصوتي يعمل',
    idle: 'إرشاد صوتي دون استخدام اليدين',
    play: 'تشغيل المدرب الصوتي',
    playShort: 'ابدأ',
    pause: 'إيقاف المدرب الصوتي مؤقتاً',
    pauseShort: 'إيقاف مؤقت',
    resume: 'استئناف المدرب الصوتي',
    resumeShort: 'استئناف',
    stepPacing: (current, total) => `الخطوة ${current} من ${total}`,
    nextStep: 'الخطوة التالية',
    prevStep: 'الخطوة السابقة',
    speed: (rate) => `السرعة ${rate}x`,
    soundOn: 'التنبيهات الصوتية مفعلة',
    soundMuted: 'التنبيهات الصوتية مكتومة',
    techNote: 'نطق المتصفح + تنبيهات المؤقت',
    countdown: (seconds) => `الثبات: ${seconds} ث`,
    countdownComplete: 'اكتمل الثبات',
    countdownActive: (seconds) => `مؤقت ثبات ${seconds} ث يعمل`,
    timerCountdown: (seconds) => `المؤقت: ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`,
    timerComplete: 'اكتمل المؤقت',
    timerActive: (seconds) => `مؤقت ${seconds} ث يعمل`,
    awaitingNext: 'سجّل مجموعاتك ثم اضغط التالي',
    unsupported: 'تحويل النص إلى كلام غير مدعوم في هذا المتصفح.',
    voiceNameDisplay: (name) => `الصوت: ${name}`,
    switchVoice: 'تغيير صوت المدرب',
    voiceLabel: 'الصوت'
  },
  shell: {
    dayBadge: (day) => `اليوم ${day}`
  },
  community: {
    categoryLabels: {
      rehab: 'تأهيل',
      dermatology: 'جلدية',
      nutrition: 'تغذية',
      metabolic: 'أيض',
      circadian: 'الساعة البيولوجية',
      cognitive: 'إدراك',
      sleep: 'نوم'
    },
    versionUpdatedPill: (v) => `v${v} · محدّثة`,
    versionHistoryTitle: 'سجل إصدارات الخطة والتغييرات',
    versionHistoryEmpty: 'لا توجد مراجعات سابقة لهذه الخطة.',
    versionCurrentBadge: 'الإصدار النشط الحالي',
    versionApprovedBadge: 'تمت مراجعته سريرياً',
    versionChangesLabel: 'التحسينات والحقول المضافة:',
    versionAuthorLabel: (author) => `بواسطة: ${author}`,
    closeVersionModal: 'إغلاق',
    hardestWeeks: 'أصعب الأسابيع',
    peak: (unit, period) => `ذروة ${unit} ${period}`,
    periodLabel: (unit, period) => `${unit} ${period}`,
    dropOffValue: (value) => `انقطاع ${value}%`,
    reviewMeta: (outcome, day) => `${outcome} · اليوم ${day}`,
    reviewAdherence: (adherence) => `التزام ${adherence}%`,
    emptyReviews: 'لا توجد سجلات تطابق هذا التصفية بعد',
    fallbackInsightLead: 'ذروة الانقطاع الشائعة في اليوم 7',
    fallbackInsightRest: 'بسبب إرهاق تكوين العادة. حافظ على انتظام مجموعاتك.',
    fallbackReviewHandle: 'مشارك · 30 ذ',
    fallbackReviewText: 'تقدم ملحوظ بالالتزام الدقيق بالمجموعات اليومية الموصوفة.',
    dayLabel: 'اليوم الحالي في الخطة',
    adherenceLabel: 'الالتزام بالخطة',
    notesLabel: 'التجربة والملاحظات العملية',
    notesPlaceholder: 'مثال: انخفض انزعاج الوتر بحلول اليوم 5، وتطلّب الإيقاع اللامركزي تركيزاً دقيقاً…',
    handleLabel: 'وصف ديموغرافي (اختياري، مجهول الهوية)',
    handlePlaceholder: 'مثال: 34 أ · عدّاءة (اختياري)',
    canonicalPaperBadge: 'ورقة بحثية مرجعية',
    canonicalPaperNote: (doi) => `مُوحّدة عبر DOI ${doi} · مشتركة بين المشاركين`,
    existingCanonicalFound: (title) => `تمت مطابقة ورقة موثقة موجودة في سجل المجتمع: ${title}`,
    emptyLiveReviews: 'لا توجد مشاركات من المجتمع بعد. كن أول من يسجل نتيجته!'
  },
  assistant: {
    stagingDescription: 'راجع الخطة السريرية المستخرجة وناقشها مع N1 AI قبل التأكيد.',
    existingCanonicalPill: (v) => `نشطة في الفهرس السريري · v${v}`,
    existingCanonicalNotice: (v) => `هذه الورقة مفهرسة بالفعل في سجلنا السريري (v${v}). يمكنك بدء المتابعة أدناه، أو أخبرني إن لاحظت أي اختلاف عن النشر الأصلي لاقتراح تحسين.`,
    proposeImprovementPrompt: 'لاحظت اختلافاً عن الورقة المنشورة: ',
    adoptExistingRoutine: 'ابدأ هذه الخطة',
    proposeImprovementButton: 'ناقش أو اقترح تصحيحاً',
    routineUpdatedNotice: (v) => `تم تحديث الخطة إلى v${v}`,
    uploadAnother: 'رفع ورقة أخرى',
    candidateStepsTitle: 'خطوات التدخل المستخرجة',
    candidateSafetyTitle: 'ضابط السلامة وقاعدة التوقف',
    candidateProgressionTitle: 'معايير التقدم',
    confirmedToast: (title) => `تمت إضافة "${title}" إلى خططك!`,
    discardedToast: 'تم تجاهل الخطة المقترحة.',
    intakeInstructionTitle: 'أضف دراسة تدخلية',
    intakeInstructionBody: 'ارفع ملف PDF لتجربة سريرية أو أدخل رابط DOI/PubMed. سيستخرج الذكاء الاصطناعي الخطة والخطوات وقواعد السلامة لتراجعها وتناقشها قبل إضافتها إلى جدولك.',
    inputStaging: 'اسأل N1 عن الورقة المقترحة',
    placeholderStaging: 'اسأل N1 عن الورقة المقترحة قبل التأكيد…',
    rejection: {
      inputLabel: 'اسأل لماذا رُفضت هذه الورقة',
      placeholder: 'اسأل لماذا رُفضت، أو الصق DOI لتجربة ورقة أخرى…',
      placeholderGuidance: 'اسأل عما تبحث عنه، أو الصق DOI لورقة…',
      source: 'المصدر · سياسة التحقق',
      guidanceSource: 'المصدر · مكتبة TrialN1 والاستكشاف',
      suggestions: {
        why: 'لماذا رُفضت هذه الورقة؟',
        whatToUpload: 'ما نوع الورقة التي يمكنني رفعها بدلاً منها؟',
        nonHuman: 'هل يمكن الاستفادة من نتائج الدراسات على الحيوانات؟'
      },
      guidanceSuggestions: {
        browseCommunity: 'تصفّح أوراق خطط المجتمع',
        searchPubmed: 'ابحث في PubMed عن تجارب سريرية',
        achilles: 'تأهيل اعتلال وتر أخيل',
        hairLoss: 'الثعلبة وإعادة نمو الشعر',
        creatine: 'الكرياتين والإرهاق الذهني',
        fasting: 'الصيام المقيد بوقت مبكر'
      },
      answers: {
        whyPrefix: 'هذا هو تعليل أداة التحقق: ',
        criteria: 'لا ينشئ TrialN1 خططاً إلا من دراسات تدخلية اتبع فيها مشاركون من البشر خطة محددة، مثل التأهيل أو العلاج الدوائي أو النوم أو التغذية أو الصيام أو التركيز الذهني أو بيئة العمل. ارفع دراسة كهذه (PDF أو رابط DOI/PubMed) وسأستخرج لك خطة يمكنك اتباعها.',
        nonHuman: 'لم يثبت أن نتائج النماذج الحيوانية أو المخبرية تعمل بالطريقة نفسها لدى البشر، لذا فإن تحويلها إلى خطة لك سيكون تخميناً. نحتاج إلى تجربة تدخلية على البشر اختبرت الخطة مباشرة.',
        scopeNote: 'يمكنني فقط توضيح سبب عدم ملاءمة هذه الورقة، لا مناقشة محتواها.',
        outOfScope: 'يمكنني فقط توضيح سبب عدم ملاءمة هذه الورقة لـ TrialN1، ولا يمكنني مناقشة طرق الدراسة أو نتائجها. ارفع ورقة تدخلية على البشر وسأساعدك في خطتها.'
      }
    },
    linkGuidance: {
      doiTipTitle: 'كيف تحصل على ورقة من PubMed أو Europe PMC:',
      doiTipSteps: [
        '1. ابحث عن موضوعك في PubMed أو Europe PMC باستخدام الأزرار أعلاه.',
        '2. اختر دراسة تدخلية على البشر (تجربة عشوائية أو سريرية).',
        '3. انسخ رقم DOI (مثل 10.1177/1941738116631498) أو رابط PubMed والصقه هنا — أو نزّل ملف PDF وأسقطه هنا.'
      ],
      searchingEuropePmc: 'جارٍ البحث في Europe PMC عن تجارب مفتوحة الوصول…',
      noSearchResults: 'لم نجد أوراقاً مفتوحة الوصول تطابق هذا المصطلح في Europe PMC. جرّب رابط البحث المباشر في PubMed أعلاه.',
      openInNewTab: 'افتح البحث في علامة تبويب جديدة',
      directDoiPrompt: 'لديك DOI أو ملف PDF بالفعل؟',
      pasteDoiPlaceholder: 'الصق DOI (مثل 10.1177/1941738116631498) أو رابط PubMed…',
      queryPill: (q) => `تبحث عن: "${q}"`
    },
    suggestionsLabel: 'أسئلة مقترحة',
    suggestions: {
      label: 'أسئلة مقترحة',
      safetyRules: 'ما قواعد التوقف والاحتياطات الخاصة بالسلامة؟',
      progressionCriteria: 'متى وكيف أنتقل إلى المرحلة التالية؟',
      biofeedbackLog: (name) => `كيف أتابع درجة ${name ? name.toLowerCase() : 'الأعراض'}؟`,
      biofeedbackEscalation: 'ما الدرجة التي توقف التصعيد؟',
      routineSchedule: 'ما الخطة اليومية الموصوفة وجدولها؟',
      missingData: 'ما المعايير التي حُذفت أو استُنتجت؟',
      trialCitation: 'أخبرني عن التجربة السريرية ومؤلفيها',
      stepDetails: (action) => `ما هو "${action}" وكيف يُؤدّى؟`
    },
    answerSource: 'المصدر · قسم الطرق',
    backToToday: 'العودة إلى اليوم',
    meta: {
      sample: 'العينة:',
      design: 'التصميم:',
      year: 'السنة:',
      sampleValue: (sampleSize) => `N = ${sampleSize}`
    },
    noAnswer: (title) => `لم أجد ذلك في قسم الطرق في هذه الورقة. جرّب السؤال عن الجرعة أو التكرار أو السلامة أو التقدم في ${title}.`,
    confirmLogged: (day, score) => `تم تسجيل اليوم ${day}. درجة المؤشر ${score}/10. جاهز لهدف الغد.`,
    confirmSafe: (day, score) => `تم تسجيل اليوم ${day}. درجة المؤشر ${score}/10. ضمن النطاق الآمن للدراسة — التقدم مستمر كما هو مخطط.`,
    dayRolloverNotification: (day) => `بدأ يوم جديد حسب توقيتك المحلي. أهلاً بك في اليوم ${day}. خطة اليوم جاهزة.`,
    reEntryWelcome: (days, nextDay) => `أهلاً بعودتك! بعد غياب ${days} أيام، تقدمك محفوظ دون أي عقوبة. فعّلنا خيارات الجرعة المصغّرة لتواصل بسلاسة في اليوم ${nextDay}.`,
    barrierLoggedConfirmation: (barrier, mode) => `تم تسجيل العائق: "${barrier}". حوّلنا جلسة اليوم إلى وضع ${mode} لتبقى عادتك مستمرة دون إرهاق.`,
    dayAdvancedConfirmation: (prevDay, nextDay) => `اكتمل اليوم ${prevDay}. انتقلت إلى اليوم ${nextDay}.`,
    simulatedHistoryConfirmation: (days, currentDay) => `تمت محاكاة ${days} يوماً من الالتزام والمؤشرات السابقة. المتابعة الحالية في اليوم ${currentDay}.`,
    simulatedFullCompletionConfirmation: (title, days) => `تمت محاكاة التجربة السريرية الكاملة لـ ${title}. سُجّلت كل الأيام الـ ${days} بالتزام 100% وقياسات نتائج مكتملة.`,
    methodsSectionSource: 'قسم الطرق والتدخلات',
    timestampJustNow: 'الآن',
    parsedSummary: (pages) => `تمت قراءة ${pages} صفحات وعزل قسم الطرق والتدخلات. استُبعدت الأقسام غير التدخلية والنقاشات النظرية.`,
    fallbackFaqQuestion: 'ما درجة الدليل لهذه الخطة؟',
    fallbackFaqAnswer: 'قُيّمت الورقة على أنها تجربة تدخلية عشوائية على البشر. المعايير المستنتجة موضحة بشكل صريح في الخطة.',
    offlineAnswers: {
      safetyStopRule: (stopText, cautionText = '') => `قاعدة التوقف للسلامة: ${stopText}${cautionText}`,
      additionalPrecaution: (cautions) => ` احتياط إضافي من الدراسة: ${cautions}`,
      studyPrecautions: (cautions) => `احتياطات الدراسة: ${cautions}`,
      progressionCriteria: (rules) => `معايير التقدم: ${rules}.`,
      prescribedDailyRoutine: (summary) => `الخطة اليومية الموصوفة: ${summary}.`,
      biofeedbackMetric: (name, maxScore, threshold, alertMsg = '') =>
        `المؤشر الحيوي اليومي: ${name} (المقياس 0–${maxScore}). حد التصعيد ≥ ${threshold}/10.${alertMsg}`,
      paperCitation: (title, journal, year, authors, sampleSize, trialType) =>
        `الدراسة: "${title}" المنشورة في ${journal} (${year}) لـ ${authors}. حجم العينة: N = ${sampleSize} (${trialType}).`,
      missingParametersSummary: (paramList) =>
        `لم يذكر مؤلفو التجربة كل معايير التنفيذ في قسم الطرق المنشور. المعايير المحذوفة أو الافتراضية: ${paramList}. طُبّقت قيم سريرية افتراضية متحفظة أو إرشادات مرجعية سابقة.`,
      noMissingParameters: 'ذكر المؤلفون كل معايير التنفيذ والجرعات والتكرارات بوضوح في قسم الطرق والتدخلات المنشور.',
      stepGuidance: (action, detail, volume, tempo, hold, inferredNote, contraindication) => {
        const lines = [
          `${action}`,
          `• ما هي: ${detail || action}. مستندة مباشرة إلى قسم الطرق والتدخلات في الدراسة المنشورة.`,
          `• المطلوب: أكمل ${volume}${tempo ? `، الإيقاع: ${tempo}` : ''}${hold ? `، الثبات: ${hold}` : ''}. حافظ على الأداء الصحيح وأكمل كل المجموعات الموصوفة لليوم.`
        ];
        if (inferredNote) lines.push(`• ملاحظة: ${inferredNote}`);
        if (contraindication) lines.push(`• تنبيه: ${contraindication}`);
        return lines.join('\n\n');
      }
    },
    excludeCandidateStep: 'استبعاد الخطوة',
    restoreCandidateStep: 'تضمين الخطوة'
  },
  processing: {
    queued: 'الاستخراج في قائمة الانتظار',
    extracting: 'جارٍ الاستخراج',
    rejectionFallback: 'رُفضت الورقة: لا تصف الدراسة تدخلاً قابلاً للتنفيذ على مشاركين من البشر.',
    stages: ['قراءة الورقة', 'عزل الطرق والتدخلات', 'التحقق من المعايير الناقصة', 'بناء مسودة خطتك'],
    ready: 'المسودة جاهزة للمراجعة. ستظهر ضمن أوراقك بعد تأكيد المعايير المستخرجة.',
    slowHint: 'ما زلنا نقرأ الورقة. قد تستغرق الأوراق الطويلة حتى دقيقة؛ أبقِ هذه النافذة مفتوحة وستظهر المسودة هنا.'
  },
  upload: {
    scopeBadge: 'دراسات تدخلية على البشر فقط',
    scopeNote: 'دراسات طبّق فيها الباحثون خطة أو تدخلاً قابلاً للقياس على مشاركين من البشر (التأهيل السريري، العلاج الدوائي، النوم، التغذية، العادات الذهنية). تُرفض الأوراق غير البشرية أو النظرية التي لا تتضمن خطة قابلة للتنفيذ.'
  },
  landing: {
    topBanner: 'أبحاث تدخلية على البشر فقط · خطط يمكن تتبعها إلى الورقة',
    heroEyebrow: 'من الدليل إلى التطبيق',
    heroTitle: 'عِش بصحة أفضل مع خطط يومية من علوم بشرية حقيقية.',
    heroSubtitle: 'يحوّل TrialN1 الأبحاث السريرية المحكّمة على البشر إلى عادات يومية بسيطة، مع تدريب صوتي وملاحظة واضحة حيثما أغفلت الورقة أحد المعايير.',
    heroCtaPrimary: 'ابدأ خطتك — مجاناً',
    heroCtaSecondary: 'استعرض المجالات الصحية',
    heroTrustPoints: [
      'تجربة فورية كزائر · دون بطاقة دفع',
      'مبني فقط على تجارب تدخلية بشرية',
      'الإجابات تقتبس من الورقة، لا تخمين'
    ],
    heroImageAlt: 'مشارك يؤدي خطة يومية مركزة للتأهيل والحركة',
    interactivePreview: {
      tag: 'معاينة',
      title: 'خطة اليوم',
      progressLabel: 'تقدم اليوم',
      step1Action: 'إنزال الكعب اللامركزي بركبة مستقيمة',
      step1Detail: 'Alfredson وآخرون 1998 · إنزال لامركزي 3 ث',
      step1Meta: '3 × 15 تكرار',
      step2Action: 'إطالة ثابتة للساق وتعافٍ',
      step2Detail: 'إرشادات ACSM · ثبات متحفظ',
      step2Meta: '3 × ثبات 30 ث',
      tryHint: 'اضغط على خطوة لإتمامها.',
      allDone: 'انتهيت من خطة اليوم. أحسنت.'
    },
    domainsTitle: 'اكتشف ما نساعدك على تحقيقه',
    domainsSubtitle: 'تجارب تدخلية على البشر مترجمة إلى خطط يومية واضحة وسهلة.',
    domains: [
      {
        id: 'rehab',
        tag: 'الحركة والتأهيل',
        title: 'تأهيل الأوتار والمفاصل',
        description: 'خطط التحميل اللامركزي والمقاومة الثقيلة البطيئة المثبتة في التجارب السريرية.',
        tone: 'orange',
        stat: 'مرجع 84 يوماً',
        image: '/images/image2.png',
        imageAlt: 'مشارك يؤدي إطالة للحركة وتأهيل المفاصل'
      },
      {
        id: 'cognitive',
        tag: 'الدماغ والطاقة',
        title: 'اليقظة الذهنية والانتباه',
        description: 'تشبّع معياري بالكرياتين، واختبارات زمن الاستجابة الحركية، وتنظيم المنشطات الذهنية.',
        tone: 'yellow',
        stat: 'خط أساس يومي'
      },
      {
        id: 'mindfulness',
        tag: 'التنفس والتركيز',
        title: 'تنظيم الجهاز العصبي والتنفس',
        description: 'التنهد الفسيولوجي الدوري وإعادة ضبط النشاط اللاودي من تجارب على البشر.',
        tone: 'sky',
        stat: 'جلسات 10 دقائق'
      },
      {
        id: 'sleep',
        tag: 'نوم عميق',
        title: 'ضوء الساعة البيولوجية وصحة النوم',
        description: 'نوافذ التعرض لضوء الصباح، وخفض الحرارة، وتقليل زمن الدخول في النوم.',
        tone: 'lavender',
        stat: 'خطة مسائية'
      },
      {
        id: 'cellular',
        tag: 'الجلدية',
        title: 'خطط كثافة فروة الرأس والخلايا',
        description: 'دورات عمق الإبر الدقيقة، والعلاج الضوئي السريري، ومتابعة الالتزام بالعلاج الموضعي.',
        tone: 'peach',
        stat: 'إيقاع أسبوعي'
      },
      {
        id: 'nutrition',
        tag: 'التغذية',
        title: 'توقيت المغذيات السريري',
        description: 'توقيت مغذيات مستند إلى الأدلة، وخطوط أساس للترطيب، وتحليل اتجاهات المؤشرات الحيوية.',
        tone: 'mint',
        stat: 'متابعة المؤشرات الحيوية'
      }
    ],
    rigorTitle: 'مبني على صرامة علمية لا تهاون فيها',
    rigorSubtitle: 'صُمم TrialN1 حصرياً للتدخلات الصحية على البشر — لا للفيزياء النظرية ولا للنماذج الحيوانية.',
    ctaContinueAsUser: (name) => `المتابعة باسم ${name}`,
    ctaSignOut: 'تسجيل الخروج',
    guestBadge: 'جلسة زائر',
    scopeBadge: 'أبحاث تدخلية على البشر فقط',
    scopeNote: 'نتحقق من التجارب السريرية وخطط التأهيل والتغذية والنوم والعلاج الدوائي. نستبعد النظريات البحتة والنماذج الحيوانية والدراسات الرصدية.',
    features: {
      gatekeeperTitle: 'أداة التحقق العلمي',
      gatekeeperBody: 'تستبعد تلقائياً النماذج غير البشرية والأوراق النظرية مع توضيح تعليمي للسبب.',
      auditingTitle: 'تدقيق المعايير الناقصة',
      auditingBody: 'تكتشف الجرعات ومدد الثبات ومعايير التنفيذ المحذوفة، وتطبّق قيماً سريرية افتراضية متحفظة.',
      safetyTitle: 'N1 AI رفيق السلامة',
      safetyBody: 'اسأل عن الجرعة والتكرار وموانع الاستعمال، والإجابة مستندة حصراً إلى طرق التجربة.',
      summaryTitle: 'موجز سريري من صفحة واحدة',
      summaryBody: 'صدّر اتجاهات الالتزام والمؤشرات الحيوية بشكل منسق لأخصائيك أو لسجلاتك الشخصية.'
    },
    demoTitle: 'هل أنت مستعد لبناء عادات يومية مدعومة بالعلم؟',
    demoSubtitle: 'أسقط أي ملف PDF لبحث سريري أو استكشف خططاً سريرية جاهزة دون أي إعداد.',
    architectureTitle: 'كيف يعمل TrialN1',
    capabilitiesTitle: 'مصمم للدقة السريرية',
    footerTagline: 'TrialN1 · ذكاء الأبحاث التدخلية على البشر'
  },
  auth: {
    nameLabel: 'الاسم الكامل',
    namePlaceholder: 'مثال: د. سارة أحمد',
    googleButton: 'المتابعة باستخدام Google',
    guestNotice: 'يحفظ وضع الزائر خططك محلياً في متصفحك. سجّل الدخول في أي وقت للمزامنة مع السحابة.',
    haveAccount: 'لديك حساب بالفعل؟ سجّل الدخول',
    needAccount: 'ليس لديك حساب؟ أنشئ حساباً',
    saveNotice: 'سجّل الدخول لمزامنة أوراقك مع السحابة',
    orWithEmail: 'أو بالبريد الإلكتروني',
    cloudSyncedBadge: 'متزامن مع السحابة',
    tabSignIn: 'تسجيل الدخول',
    tabCreateAccount: 'إنشاء حساب',
    toastValidEmail: 'يرجى إدخال بريد إلكتروني صالح.',
    toastPasswordRequired: 'يرجى إدخال كلمة المرور.',
    toastOperationNotAllowed: 'تسجيل الدخول بالبريد وكلمة المرور معطّل في إعدادات Firebase (Authentication > Sign-in method).',
    toastEmailInUse: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
    toastWeakPassword: 'يجب ألا تقل كلمة المرور عن 6 أحرف.',
    toastInvalidCredentials: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.',
    toastTooManyRequests: 'محاولات غير ناجحة كثيرة. يرجى المحاولة لاحقاً.',
    toastWelcomeBack: 'أهلاً بعودتك!',
    toastAccountCreated: 'تم إنشاء الحساب بنجاح!',
    toastAuthFailed: 'فشل تسجيل الدخول. يرجى المحاولة مرة أخرى.',
    toastGoogleSuccess: 'تم تسجيل الدخول باستخدام Google!',
    toastGoogleFailed: 'فشل تسجيل الدخول باستخدام Google.',
    toastGuestEntered: 'دخلت كزائر مستكشف'
  },
  errors: {
    boundaryTitle: 'حدث خطأ ما',
    boundaryBody: 'تعذّر تحميل هذه الصفحة. سجلاتك محفوظة.',
    retry: 'إعادة تحميل الصفحة',
    noRoutinesTitle: 'لا توجد خطط متاحة',
    noRoutinesBody: 'أضف ورقة بحثية للبدء.'
  },
  morphing: {
    dialogTitle: (name, day) => `${name} · اليوم ${day}`,
    milestoneTag: 'تقييم مرحلي',
    milestoneSuffix: ' (مرحلي)',
    dailyTag: 'مؤشر يومي',
    saveEntry: 'حفظ القياس في الخطة',
    savedToast: (name) => `تم تسجيل ${name} بنجاح`,
    values: {
      present: 'موجود',
      absent: 'غير موجود',
      photoAttached: 'صورة سريرية مرفقة',
      fieldConfirmation: (fieldName, day, displayVal) => `تم تسجيل ${fieldName} لليوم ${day} (${displayVal}).`
    },
    widgets: {
      evaluationRule: 'قاعدة التقييم: ',
      measurementCriteria: 'معايير القياس: ',
      routineNote: 'ملاحظة الخطة: ',
      routineGuidelines: 'إرشادات اختبار الخطة: ',
      photo: {
        uploadPrompt: 'التقط صورة سريرية أو ارفعها',
        dropHint: 'اسحب ملف صورة وأفلته أو انقر للاختيار',
        changePhoto: 'تغيير الصورة',
        retake: 'إعادة الالتقاط',
        instructionsLabel: 'إرشادات الخطة المعيارية للدراسة:',
        previewAlt: 'صورة التقييم السريري المرحلي',
        removePhoto: 'إزالة الصورة',
        attached: 'الصورة مرفقة بسجل المرحلة',
        uploadButton: 'رفع ملف',
        uploading: 'جارٍ الرفع إلى التخزين السحابي...',
        uploadSuccess: 'تم رفع الصورة بأمان إلى التخزين السحابي',
        uploadError: 'فشل الرفع إلى التخزين السحابي. حُفظت معاينة محلية.',
        invalidFile: 'يرجى اختيار ملف صورة (PNG أو JPG أو WebP).',
        demoCaptureButton: 'تحميل صورة تجريبية',
        demoPhotoSvgText: 'Milestone Clinical Photograph'
      },
      numeric: {
        enterValue: 'القيمة المقاسة',
        referenceRange: (min, max, unit) => `النطاق المستهدف: ${min ?? 0}–${max ?? 100} ${unit || ''}`,
        decrease: (name) => `خفض ${name}`,
        increase: (name) => `زيادة ${name}`,
        outOfRange: (min, max, unit) => `يجب أن تكون القيمة بين ${min} و${max}${unit ? ` ${unit}` : ''}. عُدّلت إلى أقرب حد.`
      },
      timer: {
        start: 'ابدأ مؤقت الاختبار',
        pause: 'إيقاف مؤقت',
        reset: 'إعادة ضبط',
        complete: 'اكتمل الاختبار!',
        targetDuration: (seconds) => `المدة المستهدفة: ${seconds} ث`,
        secondsElapsed: (seconds) => `مضت ${seconds} ثانية`,
        elapsedSummary: (seconds, max) => `مضت ${seconds} ثانية${max ? ` · المدة المستهدفة: ${max} ث` : ''}`,
        startCountdown: 'ابدأ العد التنازلي',
        remainingSummary: (remaining, total) => (remaining > 0 ? `تبقى ${remaining} ثانية من ${total} ث` : 'اكتملت الجلسة')
      },
      multichoice: {
        selectOne: 'اختر التصنيف السريري:',
        defaultOptions: ['خفيف', 'متوسط', 'شديد']
      },
      boolean: {
        yes: 'نعم، موجود',
        no: 'لا، غير موجود'
      },
      scale: {
        minimalSuffix: '· أدنى',
        severeSuffix: '· شديد'
      },
      custom: {
        pendingNotice: 'أداة جديدة! سيضيفها N1 AI خلال ساعات قليلة بعد مراجعة بشرية.',
        pendingSubtext: 'يمكنك متابعة التسجيل بأداة القياس الأساسية أدناه. بعد تأكيد المراجعة السريرية، ستظهر الأداة المخصصة هنا تلقائياً.',
        approvedBadge: 'أداة مولّدة بالذكاء الاصطناعي · تمت مراجعتها بشرياً',
        proposedTypeLabel: (type) => `واجهة مقترحة: ${type}`
      }
    },
    milestone: {
      bannerTitle: (day) => `تقييم مرحلي مجدول لليوم ${day}`,
      bannerSubtitle: 'تنص هذه الورقة على تقييم رسمي للنتائج اليوم.',
      action: 'سجّل التقييم المرحلي',
      completedBadge: 'تم توثيق المرحلة',
      reviewAction: 'مراجعة القياس'
    },
    dashboard: {
      photoSplitTitle: 'تطور الصور المرحلية',
      photoSplitSubtitle: 'تقييم فوتوغرافي معياري على امتداد مدة التجربة',
      baselineLabel: 'خط الأساس (اليوم 1)',
      currentLabel: (day) => `المرحلة (اليوم ${day})`,
      biomarkerTitle: 'اتجاهات المؤشرات الحيوية',
      biomarkerSubtitle: 'قراءاتك مقارنة بخط أساس التجربة المنشورة',
      targetZone: 'النطاق المرجعي المستهدف',
      gridToggle: 'شبكة المعايرة',
      noMilestonesYet: 'لم يكتمل أي تقييم مرحلي بعد',
      currentReading: (val, unit) => `الحالي: ${val} ${unit || ''}`.trim(),
      targetReference: (target) => `الهدف: ${target}`,
      milestonePeriod: 'فترة المرحلة:',
      dragHint: 'اسحب شريط التقسيم أفقياً لمقارنة التطور',
      overheadStandard: 'محاذاة علوية معيارية على بعد 30 سم وفق الدراسة',
      baselineAlt: 'تقييم خط الأساس في اليوم 1',
      milestoneAlt: (day) => `التقييم المرحلي لليوم ${day}`,
      sliderAria: 'نسبة المقارنة بشريط التقسيم',
      dayPill: (day) => `اليوم ${day}`,
      previewBadge: ' (معاينة)',
      dayTooltip: (day) => `اليوم ${day}`,
      dayTick: (day) => `ي${day}`,
      notScheduledPhotoNote: (currentDay, nextMilestone, daysUntil) =>
        nextMilestone && daysUntil
          ? `تقييم الصور غير مجدول لليوم ${currentDay}. صورة المرحلة التالية مجدولة لليوم ${nextMilestone} (بعد ${daysUntil} ${daysUntil === 1 ? 'يوم' : 'أيام'}).`
          : `تقييم الصور غير مجدول لليوم ${currentDay}. اكتملت كل التقييمات المرحلية للخطة.`,
      notScheduledPhotoTooltip: (nextDay) =>
        nextDay ? `غير مجدول اليوم · الصورة التالية في اليوم ${nextDay}` : 'تقييم الصور غير مجدول اليوم',
      notScheduledBiomarkerNote: (name, currentDay) => `قياس ${name} غير مجدول لليوم ${currentDay}.`,
      notScheduledBiomarkerTooltip: 'المؤشر غير مجدول اليوم',
      scheduledTodayBadge: 'مجدول اليوم',
      notScheduledBadge: 'غير مجدول اليوم',
      noReadingsBadge: 'لا توجد قراءات بعد',
      emptyBiomarkerTitle: 'لم تُسجّل أي قراءة للمؤشرات الحيوية بعد',
      emptyBiomarkerBody: (label) => `سجّل أول قراءة لـ ${label} لمتابعة اتجاهك مقارنة بالنطاق المرجعي للدراسة.`,
      logFirstReading: 'سجّل قراءة',
      missingBaselinePhoto: 'لم تُسجّل صورة خط الأساس لليوم 1 بعد',
      missingMilestonePhoto: (day) => `لم تُسجّل صورة المرحلة لليوم ${day} بعد`,
      uploadPhotoPrompt: 'سجّل صورة سريرية في يوم المرحلة المجدول لمقارنة التطور.'
    }
  },
  policyLedger: {
    dialogLabel: 'سجل سياسات الضوابط السريرية',
    title: 'سجل السياسات السريرية',
    lifecycleNotice: 'تنبيه: لوحة الحوكمة هذه مفتوحة مؤقتاً لتقييم مسابقة Google AI Builder Cup، وستُغلق نقاط الإدارة بعد المسابقة خلف صلاحيات مؤسسية ومصادقة متعددة العوامل.',
    firestoreLive: 'Firestore متصل',
    memoryCache: 'ذاكرة مؤقتة · وضع آمن',
    versionFallback: 'الأساس',
    versionLabel: (version) => `الإصدار ${version} · Google Cloud Firestore`,
    close: 'إغلاق سجل السياسات',
    governanceBadge: 'حوكمة ديناميكية أثناء التشغيل',
    governanceDesc: 'تُطبّق السياسات ديناميكياً من Cloud Firestore على كل عمليات الاستخراج وجلسات Gemma على الجهاز ومحفزات خفض الحمل، دون إعادة نشر.',
    thresholdLabel: 'حد التصعيد للأعراض الجانبية',
    thresholdDesc: 'يتوقف التقدم عندما يتجاوز انزعاج المشارك هذا المستوى',
    mildLabel: '1 (خفيف)',
    severeLabel: '10 (شديد)',
    reductionLabel: 'خفض الحمل الموصى به',
    reductionDesc: 'نسبة خفض الحمل أو الجرعة المطبقة عند تجاوز الحد',
    bannedLabel: 'معايير الرفض التلقائي',
    bannedDesc: 'تُرفض فوراً الدراسات التي تطابق هذه الكلمات المفتاحية',
    pendingWidgetsLabel: 'قائمة مراجعة أدوات الذكاء الاصطناعي',
    pendingWidgetsDesc: 'أكّد الأدوات المولّدة لنقاط نهاية الدراسات الجديدة لإضافتها إلى قاعدة البيانات وعرضها للمستخدمين.',
    noPendingWidgets: 'لا توجد أدوات مخصصة بانتظار التأكيد البشري.',
    approveWidgetButton: 'تأكيد وإضافة الواجهة',
    approvedWidgetStatus: 'مؤكدة ومفعّلة',
    toastWidgetApproved: (title) => `تم تأكيد أداة "${title}" وإضافتها لواجهة المستخدم`,
    toastWidgetApproveError: 'فشل تأكيد أداة الذكاء الاصطناعي',
    syncActive: 'مزامنة Cloud Firestore فعالة',
    syncFallback: (status) => `Cloud Firestore ${status} (يُستخدم السجل من الذاكرة)`,
    resetBaseline: 'استعادة الأساس',
    cancel: 'إلغاء',
    syncing: 'جارٍ مزامنة السجل…',
    saveSync: 'حفظ ومزامنة السياسة',
    upToDate: 'السياسة محدّثة',
    toastUpdated: 'تم تحديث سجل الضوابط السريرية',
    toastUpdateError: 'فشل تحديث سجل الضوابط',
    toastNetworkError: 'خطأ في الشبكة أثناء تحديث السجل',
    toastReset: 'أُعيدت الضوابط إلى المعايير السريرية الأساسية',
    toastResetError: 'فشلت إعادة ضبط الضوابط'
  },
  howTo: {
    buttonLabel: 'طريقة الاستخدام والأوراق الرائجة',
    buttonShort: 'طريقة الاستخدام',
    buttonExploreSamples: 'استكشف الأوراق الرائجة',
    badge: 'مسار بحثي تفاعلي',
    intro: 'يحوّل TrialN1 الأبحاث التدخلية المحكّمة على البشر إلى خطط يومية قابلة للتنفيذ، ويحدد كل معيار أغفلته الورقة، ويضيف N1 AI رفيقاً يجيب من الورقة.',
    tabs: {
      samples: 'الأوراق الرائجة'
    },
    steps: [
      {
        step: '01',
        title: 'استيعاب ملف البحث',
        description: 'ارفع أي تجربة سريرية محكّمة أو ورقة تدخلية على البشر. يحلل الذكاء الاصطناعي قسمي الطرق والنتائج لاستخراج الجرعة والإيقاع والمجموعات وموانع الاستعمال.'
      },
      {
        step: '02',
        title: 'واجهة تتشكل من الورقة',
        description: 'تبني الورقة واجهتها: صور مرحلية للجلدية، ومؤقتات استجابة للتجارب الذهنية، وعدادات رقمية للمؤشرات مثل سكر الدم أو ضغط الدم.'
      },
      {
        step: '03',
        title: 'سلامة تكيفية ومؤشرات حيوية',
        description: 'تابع مجموعاتك اليومية وسجّل مدى التحمل. يتوقف التصعيد تلقائياً ويُوصى بخفض الحمل عند تجاوز حدود الانزعاج المحددة في سجل الضوابط.'
      }
    ],
    samplesTitle: 'الأوراق البحثية السريرية الرائجة',
    trendingTitle: 'الأوراق البحثية السريرية الرائجة',
    samplesSubtitle: 'استكشف أعلى الأوراق البحثية السريرية تصنيفاً في قاعدة بياناتنا، واطّلع على عدد من يتبع كل منها وعدد مرات تسجيلهم.',
    trendingSubtitle: 'استكشف أعلى الأوراق البحثية السريرية تصنيفاً في قاعدة بياناتنا، واطّلع على عدد من يتبع كل منها وعدد مرات تسجيلهم.',
    firestoreSyncLive: 'Firebase Firestore متصل',
    firestoreSyncLocal: 'فهرس محلي موثق',
    filterByTopic: 'التصفية حسب:',
    clearFilter: 'إزالة تصفية الموضوع',
    loadButton: 'ابدأ هذه الخطة',
    loadedButton: 'قيد التنفيذ',
    inProgressButton: 'قيد التنفيذ',
    redoButton: 'إعادة',
    downloadPdfButton: 'تنزيل ملف PDF مفتوح الوصول',
    doiLabel: 'عرض في PMC / DOI',
    loadedToast: (title) => `بدأت متابعة "${title}" من اليوم 1`,
    redoToast: (title) => `أُعيدت متابعة "${title}" من اليوم 1`,
    trendingRankBadge: (rank) => `#${rank} رائج`,
    activeTrackersBadge: (count) => `${count.toLocaleString('ar')} ${count === 1 ? 'متابع نشط' : 'متابعين نشطين'}`,
    totalLogsBadge: (count) => `${count.toLocaleString('ar')} ${count === 1 ? 'سجل' : 'سجلات'}`,
    featuresHeader: 'نقاط نهاية التجربة والواجهات المختبرة:',
    scopeTitle: 'نطاق التحقق الصارم',
    scopeSubtitle: 'يتخصص TrialN1 حصرياً في العلوم التدخلية على البشر. تُرفض الموضوعات النظرية والنماذج الحيوانية.',
    acceptedHeader: 'الموضوعات المقبولة',
    acceptedList: [
      'خطط تأهيل العظام والعضلات والعلاج الطبيعي',
      'التجارب السريرية الدوائية والغذائية على البشر',
      'جدولة النوم والعلاج بالضوء وصحة الساعة البيولوجية',
      'الجلدية وخطط العلاج الموضعي التجديدي',
      'دراسات القلب والجهاز التنفسي ووصف التمارين'
    ],
    rejectedHeader: 'الموضوعات المرفوضة (تُرفض تلقائياً)',
    rejectedList: [
      'الدراسات قبل السريرية على الحيوانات (الفئران، الجرذان، القوارض، الأرانب)',
      'التجارب المخبرية وزراعة الخلايا وتجارب أطباق المختبر',
      'الفيزياء النظرية والرياضيات وعلم الكون ونظرية الكم',
      'الاقتصاد الكلي والمالية وعلوم الحاسوب غير الصحية',
      'الاستطلاعات الرصدية البحتة التي تفتقر إلى تدخل قابل للتطبيق'
    ],
    testGatekeeperTitle: 'اختبر أداة التحقق',
    testGatekeeperSubtitle: 'نزّل ملف PDF لدراسة قبل سريرية على القوارض لتتحقق من أن أداة التحقق تكتشف الأبحاث غير البشرية وترفضها مع توضيح تعليمي.',
    testGatekeeperBadge: 'اختبار رفض مقصود'
  },
  onboarding: {
    samplesHeading: 'ابدأ بهذه الأوراق البحثية الرائجة:',
    trendingHeading: 'ابدأ بهذه الأوراق البحثية الرائجة:',
    viewAllTrending: 'استكشف كل الأوراق الرائجة',
    quickLoadButton: 'ابدأ الخطة',
    noActiveRoutine: 'لا توجد خطة نشطة',
    noActiveRoutineDesc: 'ارفع ورقة بحثية أو اختر ورقة سريرية رائجة لبدء المتابعة.'
  }
};
