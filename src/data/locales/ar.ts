import { COPY } from '../copy';
import type { DeepPartial, LocaleCopy } from './types';

/**
 * Modern Standard Arabic (فصحى معاصرة راقية ومبسطة) with Gulf healthcare alignment.
 * Grounded in clinical terminology from DoH Abu Dhabi, SEHA, and MoHAP.
 * Strictly non-punitive, encouraging, and clear.
 */
export const COPY_AR_OVERRIDE: DeepPartial<LocaleCopy> = {
  metadata: {
    lang: 'ar',
    title: 'ڤيسكوتو N1 // أبحاث الذكاء الاصطناعي والخطط الصحية اليومية',
    description:
      'منصة رقمية مدعومة بالذكاء الاصطناعي تحول الأبحاث السريرية المحكمة إلى خطط صحية يومية قابلة للتطبيق والتكيف.',
    keywords: [
      'خطط صحية',
      'خطط سريرية',
      'استخراج أبحاث الذكاء الاصطناعي',
      'تجارب سريرية',
      'طب مخصص',
      'إعادة تأهيل'
    ],
    openGraphTitle: 'ڤيسكوتو N1 // أبحاث الذكاء الاصطناعي والخطط الصحية اليومية',
    openGraphDescription:
      'تحويل أوراق البحث المعقدة إلى خطط صحية يومية قابلة للتنفيذ مع ڤيسكوتو، رفيق الأمان التكيفي.'
  },
  brand: {
    mark: '//',
    name: 'ڤيسكوتو N1',
    initials: 'VN'
  },
  greeting: {
    morning: 'صباح الخير،',
    afternoon: 'مساء الخير،',
    evening: 'مساء النور،'
  },
  common: {
    percentComplete: (percent: number) => `اكتمل بنسبة ${percent}%`,
    opensInNewTab: '(يفتح في علامة تبويب جديدة)',
    percentSign: '%',
    warningPrefix: '⚠'
  },
  nav: {
    primaryLabel: 'القائمة الرئيسية',
    mobileLabel: 'التنقل الرئيسي للهاتف',
    today: 'اليوم',
    stats: 'الإحصائيات',
    community: 'المجتمع'
  },
  shell: {
    streak: (days: number) =>
      days === 1
        ? 'يوم التزام واحد'
        : days === 2
        ? 'يومان من الالتزام'
        : days <= 10
        ? `${days} أيام التزام`
        : `${days} يوماً من الالتزام`,
    addPaper: 'إضافة بحث جديد',
    openAssistant: 'اسأل ڤيسكوتو',
    resetDemo: 'إعادة ضبط التجربة',
    assistantFab: (title: string) => `اسأل ڤيسكوتو عن ${title} أو ارفع ملف PDF`,
    todaySummaryLabel: 'تقدم اليوم',
    noActiveProtocol: 'لا توجد خطة نشطة',
    noActiveRoutine: 'لا توجد خطة نشطة',
    noActivePrompt: 'قم برفع ورقة بحثية أو استكشف الخطط الرائجة لبدء المتابعة.',
    dayOfTotal: (day: number, total: number) => `اليوم ${day} / ${total}`,
    dropTitle: 'اسحب للاستخراج الفوري',
    dropSubtitle: 'سنعزل منهجية الدراسة ونبني خطتك الصحية',
    dropScope: 'أبحاث سريرية بشرية تداخلية · تجارب منضبطة وخطط سلوكية'
  },
  switcher: {
    heading: 'أوراقك البحثية',
    addPaper: 'إضافة بحث جديد',
    meta: (day: number, total: number, percent: number) => `اليوم ${day}/${total} · ${percent}% اليوم`
  },
  papers: {
    queuedNote: 'جارٍ استخراج الخطة...',
    initialQueuedPaperName: 'تقييد الإضاءة المسائية وفترة الدخول في النوم',
    initialQueuedPaperNote: 'دراسة أولية · بانتظار مراجعتك'
  },
  routine: {
    eyebrow: (day: number, total: number) => `اليوم ${day} من ${total}`,
    title: (percent: number) => `اكتمل بنسبة ${percent}%`,
    progressLabel: 'التقدم اليومي',
    historyEyebrow: 'الخطة',
    historyTitle: 'السجل',
    openDashboard: 'فتح لوحة المؤشرات',
    feedbackEyebrow: 'التقييم',
    feedbackTitle: 'التسجيل',
    metricEyebrow: (name?: string) => (name ? name : 'التقييم الذاتي'),
    metricTitle: (title?: string) => (title ? title : 'السجل'),
    feedbackDay: (day: number) => `اليوم ${day}`,
    noNotes: 'لا توجد ملاحظات',
    emptyFeedbackTitle: 'لم يتم تسجيل تقييم بعد',
    emptyMetricTitle: (name?: string) => (name ? `لم يتم تسجيل ${name} بعد` : 'لم يتم تسجيل تقييم بعد'),
    emptyFeedbackBody: 'سجل استجابتك وشعورك بعد كل جلسة لتتمكن الخطة من التكيف الذاتي.',
    emptyStepsTitle: 'لم تُستخرج خطوات',
    emptyStepsBody: 'لم يوثق هذا البحث خطوات سريرية قابلة للتنفيذ.'
  },
  bctLedger: {
    eyebrow: 'الطب السلوكي الإكلينيكي',
    title: 'سجل تقنيات تغيير السلوك (BCT Taxonomy v1)',
    subtitle:
      'تقنيات معتمدة أكاديمياً لتعديل السلوك الصحي (Michie et al. 2013) مدمجة في خطط وبرامج ڤيسكوتو N1.',
    dialogLabel: 'سجل تقنيات تغيير السلوك',
    closeButton: 'إغلاق السجل',
    clusterLabel: 'تصنيف التقنية السلوكية',
    mechanismLabel: 'الآلية النفسية والعصبية',
    implementationLabel: 'التطبيق العملي في ڤيسكوتو',
    targetBarriersLabel: 'عوائق بيئة الخليج المستهدفة',
    openLedgerButton: 'استعراض تصنيف BCT السلوكي'
  },
  healthAge: {
    eyebrow: 'الأثر السريري',
    title: 'توقع العمر الصحي الحيوي',
    projectedAgeLabel: 'العمر الصحي المتوقع',
    deltaLabel: (delta: number) => `أصغر بـ ${Math.abs(delta)} سنوات بيولوجياً`,
    baselineAgeLabel: (age: number) => `العمر الزمني المرجعي: ${age} سنة`,
    cvdRiskLabel: 'انخفاض مخاطر القلب والأوعية الدموية',
    metabolicRiskLabel: 'انخفاض مخاطر المتلازمة الأيضية',
    resilienceLabel: 'مؤشر مرونة العادة السلوكية',
    resilienceCaption: 'معدل تحويل المعوقات لخطوات ميسّرة واستدامة الالتزام',
    bctLinkText: 'الاطلاع على تقنيات BCT المعتمدة'
  },
  reEntry: {
    badge: 'مرحباً بعودتك',
    title: 'استئناف الخطة بسلاسة',
    subtitle: (days: number) =>
      days > 1
        ? `توقفت لمدة ${days} أيام. الانقطاعات المؤقتة جزء طبيعي تماماً من بناء العادات الصحية طويلة الأمد. دعنا نكيّف خطة اليوم للحفاظ على زخم التزامك.`
        : 'دعنا نكيّف خطة اليوم لتناسب ظروفك الحالية ومستوى طاقتك.',
    question: 'ما الذي استجد أو حال دون إتمام خطتك؟',
    barrierHint: 'تسجيل العوائق يساعد ڤيسكوتو على فهم جدولك وتقديم توصيات استشفاء مخصصة لك.',
    barriers: {
      time_crunch: {
        label: 'ضيق الوقت / انشغال مكثف',
        description: 'جدول مواعيد ممتلئ، مهام عمل عاجلة، أو ضيق في الوقت المتاح'
      },
      fatigue_energy: {
        label: 'إرهاق شديد / تراجع الطاقة',
        description: 'شعور بالإجهاد البدني، قلة النوم، أو بطء الاستشفاء'
      },
      discomfort_pain: {
        label: 'عدم ارتياح / آلام موضعية',
        description: 'إجهاد عضلي، آلام مفصلية، أو بوادر إجهاد مؤقت'
      },
      routine_travel: {
        label: 'سفر أو تغير في الروتين',
        description: 'تنقل خارج المنزل، دوام نوبات متقلب، أو تغير في نمط اليوم'
      },
      fasting_deficit: {
        label: 'صيام رمضان / قلة النوم وحرارة الصيف',
        description: 'ساعات الصيام في رمضان، قلة ساعات النوم، أو حرارة الصيف'
      },
      other: {
        label: 'أولوية شخصية أو ظرف آخر',
        description: 'التزامات عائلية، ظروف طارئة، أو أولويات شخصية'
      }
    },
    doseModeHeading: 'اختر نمط إنجاز اليوم',
    doseModes: {
      standard: {
        title: 'الجرعة الكاملة (100%)',
        badge: 'قياسي',
        desc: 'تنفيذ جميع المجموعات والتمارين المقررة بالكامل في البحث السريري.'
      },
      micro: {
        title: 'الخطوة الميسّرة لمواصلة الالتزام (~2 د)',
        badge: 'موصى به',
        desc: 'جلسة واحدة فقط من الحركات الأساسية لحماية استمرارية العادة السلوكية دون إجهاد.'
      },
      rest: {
        title: 'استشفاء نشط ومرونة',
        badge: 'لطيف',
        desc: 'استراحة إيجابية، ترطيب، وحفاظ كامل على سلسلة التزامك دون انقطاع.'
      }
    },
    confirmBarrier: 'استئناف الخطة بالنمط المحدد',
    dismiss: 'المتابعة بالنمط القياسي',
    barrierLoggedToast: (mode: string) => `تم تكييف الخطة · نمط ${mode} مفعل الآن`,
    microDoseCompletedToast: 'أحسنت! أتممت الخطوة الميسّرة وحافظت على وتيرة الالتزام دون انقطاع.'
  },
  doseMode: {
    label: 'نمط إنجاز اليوم',
    standard: 'كاملة (100%)',
    micro: 'خطوة ميسّرة (~2 د)',
    rest: 'استشفاء نشط',
    activeTooltip: (mode: string) => `النمط النشط حالياً: ${mode}`,
    microNotice: 'الخطوة الميسّرة مفعلة: أنجز مجموعة واحدة لتحقيق نسبة 100% لإنجاز اليوم.'
  },
  lifestyleTuning: {
    badge: 'التكيف السياقي',
    title: 'الملف السلوكي والبيئي المتكيف',
    tuneButton: 'تخصيص الخطة للسياق',
    topBarPill: (region: string, tagCount: number) =>
      tagCount > 0 ? `${region} · ${tagCount} عوامل مخصصة` : `${region} · تخصيص الخطة`,
    detectedLocationGreeting: (country: string, city?: string) =>
      `مرحباً بك! نلاحظ أنك تتابع خطتك من ${city ? `${city}، ` : ''}${country}. هل هذا دقيق؟`,
    unknownLocationGreeting:
      'مرحباً بك! من أي مدينة أو منطقة تتابع خطتك؟ يساعدنا تحديد موقعك على مواءمة خطتك مع المناخ، وساعات الصيام، ونمط العمل المحلي.',
    confirmLocationBtn: (cityOrCountry: string) => `✓ نعم، ${cityOrCountry}`,
    changeLocationBtn: 'تغيير المنطقة',
    customPromptPlaceholder:
      'اكتب أو تحدث: مثال "أعمل بنظام النوبات الليلية في المستشفى وأدخن الشيشة في العطلات"...',
    suggestionsEyebrow: (region: string) => `عوامل نمط الحياة الشائعة في ${region}`,
    tagAddedToast: (tag: string) => `تمت إضافة "${tag}" إلى ملفك الصحي`,
    tagRemovedToast: (tag: string) => `تمت إزالة "${tag}" من ملفك الصحي`,
    lifestyleIntro: (region: string) =>
      `إليك أبرز العوامل الشائعة في ${region}. اختر ما ينطبق على يومك، أو صف جدولك وعاداتك بكلماتك الخاصة:`,
    tagAddedConfirmation: (tag: string) =>
      `تمت إضافة "${tag}". قمنا بمواءمة معايير خطتك اليومية وجدول المتابعة.`,
    crowdsourcedTagNotice: (tag: string, country: string) =>
      `تم تسجيل "${tag}" لمنطقة ${country}. سيستفيد المشاركون في منطقتك من هذا الخيار مستقبلاً!`,
    lifestyleTunedConfirmation: (summary: string) =>
      `تم تحديث ملفك بنجاح! ${summary}. خطتك اليومية ومؤشراتك الحيوية الآن متوافقة تماماً مع ظروفك الواقعية.`,
    filterAll: 'جميع المشاركين',
    filterSmokers: 'فئة المدخنين / الشيشة',
    filterNonSmokers: 'غير المدخنين',
    filterRamadan: 'فئة الصائمين (رمضان)',
    filterShiftWork: 'العاملون بنظام النوبات'
  },
  dayActions: {
    markComplete: 'تحديد اليوم كمكتمل',
    dayLogged: (day: number) => `✓ تم تسجيل اليوم ${day}`,
    logFeedback: (name?: string) => (name ? `تسجيل ${name}` : 'تسجيل التقييم الذاتي'),
    advanceToNextDay: (day: number) => `الانتقال إلى اليوم ${day}`,
    simulatePastDays: (count: number) => `محاكاة ${count} أيام سابقة (إشراف)`,
    simulateFullCompletion: 'محاكاة إتمام البحث بالكامل (إشراف)',
    adminControlEyebrow: 'أدوات الاختبار والمحاكاة',
    advancedToast: (day: number) => `تم الانتقال إلى اليوم ${day}`,
    simulatedToast: (days: number) => `تمت محاكاة ${days} يوماً من سجل المتابعة`
  },
  safety: {
    escalationAlert:
      'تجاوزت درجة الإجهاد الحد الآمن. تم تعليق الزيادة في الشدة مؤقتاً. التوصية: تخفيف الحمل أو الجرعة بنسبة 20% غداً أو استشارة الطبيب.',
    dynamicEscalationAlert: (name?: string, customMessage?: string) =>
      customMessage ||
      `تجاوزت درجة ${name || 'الإجهاد'} الحد الآمن. تم تعليق الزيادة في الشدة مؤقتاً. التوصية: تخفيف الحمل بنسبة 20% غداً واستشارة الأخصائي.`,
    escalationShort: 'تم إيقاف التصعيد مؤقتاً — يوصى بتخفيف الحمل 20% لليوم التالي',
    pausedRecommendation: 'متوقف مؤقتاً — يرجى تخفيف الحمل أو الجرعة بنسبة 20% غداً.',
    clinicalDisclaimer:
      'تنويه طبي سريري: تقدم منصة ڤيسكوتو N1 استخراجاً تعليمياً للخطط الصحية مستنداً بدقة إلى الأدبيات السريرية المحكمة. ولا تقدم المنصة تشخيصاً طبياً أو وصفة علاجية، ولا تغني عن الإشراف الطبي المباشر من طبيب مرخص أو أخصائي علاج طبيعي.',
    baselineEscalationAlert:
      'تم تجاوز حد الألم الآمن (≥ 4/10). تم إيقاف زيادة الشدة تلقائياً حفاظاً على سلامتك.'
  },
  calendar: {
    listLabel: 'سجل أيام الخطة الصحية',
    range: (start: number, end: number, total: number) => `الأيام ${start}–${end} من ${total}`,
    upcoming: (day: number) => `اليوم ${day}، القادم`,
    progress: (day: number, percent: number) => `اليوم ${day}، اكتمل بنسبة ${percent}%`,
    legend: {
      complete: 'مكتمل',
      partial: 'جزئي',
      today: 'اليوم'
    }
  },
  severityLevels: {
    mild: 'خفيف',
    moderate: 'متوسط',
    severe: 'شديد'
  },
  feedbackDrawer: {
    dialogLabel: 'نافذة التقييم الذاتي',
    close: 'إغلاق نافذة التقييم',
    header: (day: number) => `التقييم الذاتي · اليوم ${day}`,
    minLabel: (min: number) => `${min} · لا يوجد إجهاد`,
    maxLabel: (max: number) => `${max} · أقصى إجهاد`,
    notesLabel: 'الملاحظات والاستجابة',
    notesPlaceholder: 'مثال: شعرت بتحسن بعد التمرين، تيبس خفيف في الصباح...',
    save: 'حفظ التقييم والمتابعة',
    saved: 'تم حفظ التقييم بنجاح'
  },
  task: {
    complete: (action: string) => `إكمال ${action}`,
    uncheck: (action: string) => `إلغاء تحديد ${action}`,
    frequency: 'التكرار اليومي',
    taskQuestionPrompt: (action: string) => `ما هي التقنية السريرية الصحيحة لتنفيذ "${action}"؟`
  },
  community: {
    eyebrow: 'المجتمع والبيانات الواقعية',
    title: 'أدلة الفعالية الواقعية',
    activeTab: 'نتائج الخطة النشطة',
    exploreTab: 'استكشاف الأبحاث الرائجة',
    goToRoutine: 'الانتقال إلى خطتي اليومية',
    trackButton: 'متابعة الخطة',
    defaultProtocolTitle: 'خطة بحثية',
    versionPill: (v: string) => `الإصدار ${v}`,
    comparisonLabel: 'البحث السريري مقابل التطبيق الواقعي',
    studyEfficacy: 'الفعالية المسجلة في الدراسة المخبرية',
    studyCaption: (sampleSize: number) => `دراسة مخبرية · العينة = ${sampleSize}`,
    realWorldEfficacy: 'الفعالية في التطبيق الواقعي',
    realWorldCaption: (users: number | string) => `استناداً إلى ${users} مشاركاً واقعياً`,
    dropOffLabel: 'نقاط التوقف والانقطاع الشائعة',
    dropOffEyebrow: 'تحليل الانقطاع',
    hardestDays: 'أصعب الأيام التزاماً',
    emptyChart: 'لا توجد بيانات مجتمعية كافية بعد',
    reviewsLabel: 'تجارب وملاحظات المشاركين',
    reviewsEyebrow: 'المشاركون',
    reviewsTitle: 'تقييمات النتائج الواقعية',
    filterLabel: 'تصفية التقييمات حسب النتيجة',
    filters: {
      all: 'الكل',
      improved: 'تحسن ملحوظ',
      adjusted: 'تم التعديل والتكييف',
      paused: 'توقف مؤقت'
    },
    shareExperience: 'شارك نتيجتك وتجربتك',
    shareAction: 'تسجيل نتيجة',
    shareModalTitle: 'تسجيل النتيجة السريرية الواقعية',
    shareModalEyebrow: 'مساهمة مجتمعية',
    shareModalDesc:
      'ساهم ببيانات تقدمك الواقعي لمساعدة المشاركين الآخرين على معرفة ما يمكن توقعه في هذه الخطة البحثية.',
    outcomeLabel: 'الاستجابة الإجمالية',
    outcomes: {
      improved: 'تحسن — تقدم ملحوظ في الهدف أو الأعراض المستهدفة',
      adjusted: 'معدل — تم تعديل الحمل أو الحجم أو الوتيرة',
      paused: 'متوقف مؤقتاً — توقف مؤقت بسبب الإرهاق أو عدم الارتياح'
    },
    submitting: 'جارٍ نشر النتيجة...',
    submitReview: 'نشر إلى سجل المجتمع',
    cancel: 'إلغاء',
    reviewSuccessToast: 'تم نشر نتيجتك بنجاح إلى سجل المجتمع السريري',
    reviewErrorToast: 'تعذر حفظ النتيجة. يرجى المحاولة مرة أخرى.'
  },
  badges: {
    rct: 'تجربة معشاة منضبطة (RCT)',
    pilot: 'دراسة أولية / رائدة',
    missingParameters: '⚠ معايير مستنتجة'
  },
  assistant: {
    dialogLabel: 'المساعد الذكي ڤيسكوتو',
    close: 'إغلاق ڤيسكوتو',
    modeLabel: 'وضع المساعد',
    modes: {
      ask: 'استفسار',
      upload: 'إضافة بحث',
      lifestyle: 'نمط الحياة'
    },
    eyebrowUpload: 'بحث سريري جديد',
    titleAsk: 'اسأل ڤيسكوتو',
    titleUpload: 'إضافة ورقة بحثية',
    stagingTitle: 'مراجعة مسودة الخطة المستخرجة',
    stagingEyebrow: 'الخطة المستخرجة',
    confirmAddPaper: 'تأكيد وبدء الخطة',
    discardCandidate: 'تجاهل',
    noActiveProtocolForAskTitle: 'لا توجد خطة نشطة محددة',
    noActiveProtocolForAskBody: 'قم برفع ورقة بحثية أو اختر خطة من الأبحاث الرائجة للبدء في توجيه الأسئلة.',
    switchToUpload: 'إضافة بحث',
    typing: 'ڤيسكوتو يكتب الآن...',
    attach: 'إرفاق ملف PDF',
    send: 'إرسال',
    inputAsk: 'اسأل ڤيسكوتو عن هذه الخطة السريرية',
    inputUpload: 'أدخل رابط DOI أو PubMed أو ارفع الملف',
    placeholderAsk: 'اسأل عن الجرعات، التوقيت، الأمان، أو قواعد التقدم...',
    placeholderUpload: 'الصق رابط البحث أو ارفع ملف PDF...',
    emptyTitle: 'لا توجد رسائل سابقة',
    emptyBody: 'اسأل عن الجرعات، وتيرة التمرين، معايير الأمان، أو قواعد التصعيد.',
    medicalDisclaimerChip: 'التنويه السريري',
    medicalDisclaimerTitle: 'التنويه والإرشاد الطبي السريري',
    medicalDisclaimerGotIt: 'فهمت ذلك',
    closeDisclaimer: 'إغلاق التنويه',
    engines: {
      onDeviceGemma: '⚡ نموذج Gemma الداخلي (على الجهاز)',
      cloudGemini: '☁️ سحابة Gemini Flash',
      serverGemma: '⚡ خادم Gemma 2',
      localRules: '🔒 المطابق السريري المحلي',
      onDeviceBadge: 'داخلي (فوري · خصوصية تامة)',
      cloudBadge: 'ذكاء سحابي',
      localBadge: 'مطابق محلي',
      activeEngineLabel: 'محرك الذكاء الاصطناعي:'
    }
  },
  upload: {
    title: 'رفع ورقة بحثية سريرية (PDF)',
    body: 'اسحب ملف PDF هنا أو اضغط للاختيار من جهازك',
    browse: 'تصفح الملفات',
    invalidType: 'نوع الملف غير صالح. يرجى رفع ملف PDF فقط.'
  },
  auth: {
    loginTitle: 'مرحباً بعودتك',
    loginSubtitle: 'تسجيل الدخول لمتابعة خطتك ومزامنة نتائجك',
    signupTitle: 'إنشاء حساب سريري',
    signupSubtitle: 'ابدأ بمتابعة خططك الصحية وتتبع التزامك',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    loginButton: 'تسجيل الدخول',
    signupButton: 'إنشاء الحساب',
    guestButton: 'المتابعة كضيف',
    signOut: 'تسجيل الخروج',
    defaultGuestName: 'مشارك سريري',
    signInToSyncBadge: 'سجل الدخول للمزامنة',
    adminBadge: 'مشرف'
  },
  howTo: {
    dialogLabel: 'دليل الاستخدام والأبحاث الرائجة',
    title: 'كيف تحول أبحاث العلوم الإنسانية إلى خطط صحية يومية',
    eyebrow: 'إرشادات الاستخدام'
  },
  onboarding: {
    welcomeEyebrow: 'البداية السريعة',
    welcomeTitle: 'حوّل الأبحاث السريرية إلى خطط صحية يومية قابلة للتطبيق',
    welcomeSubtitle:
      'تقوم منصة ڤيسكوتو N1 بقراءة الأوراق السريرية المحكمة وتحويلها إلى برامج صحية قابلة للتنفيذ والتكيف. ابدأ بملف البحث الخاص بك أو استكشف الأبحاث السريرية الرائجة في قاعدتنا.',
    ctaUpload: 'رفع ورقة بحثية',
    ctaHowTo: 'دليل الاستخدام والأبحاث الرائجة',
    dropPrompt: 'اسحب ملف PDF البحثي هنا للاستخراج الفوري',
    dropSubtext: 'تجارب سريرية، إعادة تأهيل، تغذية، نوم، وعلوم دوائية بشرية'
  },
  landing: {
    uaeEditionLink: '🇦🇪 إصدار أبوظبي والإمارات · التحدي 09'
  },
  uaeLanding: {
    meta: {
      title: 'فيسكوتو N1 الإمارات // استدامة السلوكيات الصحية في أبوظبي',
      description:
        'تحدي الابتكار الصحي الرقمي للمستقبل: منصة سلوكية تكيفية مصممة لبيئة أبوظبي ودولة الإمارات، تعالج انكسار العادات عبر الخطوات الميسّرة والتكيف مع المناخ الحار وتنظيم أوقات شهر رمضان.'
    },
    challengeBadge: 'تحدي الابتكار الصحي الرقمي للمستقبل · أبوظبي 2026',
    challengeSubbadge: 'محور الرفاهية والصحة · التحدي 09: استدامة السلوكيات الصحية',
    heroTitle: 'استدامة السلوكيات الصحية في أبوظبي والإمارات — بمرونة علمية ودون انقطاع عقابي.',
    heroSubtitle:
      'حرارة الصيف المرتفعة ونوبات العمل المتغيرة والتحديات اليومية قد تعيق تطبيقات اللياقة التقليدية الصارمة. فيسكوتو يتكيف مع واقعك بخطوات ميسّرة وبمسار استعادة نشاط مرن يحفظ استمرارية عاداتك ولا يعيدك إلى نقطة الصفر.',
    ctaStartTrial: 'ابدأ الخطة المتكيفة مع الإمارات',
    ctaExploreProtocols: 'استكشف الخطط الصحية الإكلينيكية',
    backToGlobal: 'الإصدار العالمي',
    trustMetrics: {
      noStreakBreakTitle: 'وداعاً لانكسار العادات',
      noStreakBreakDesc: 'انقطاع الأيام لا يصفر إنجازك بل يفعّل استعادة النشاط المرنة تلقائياً.',
      clinicalRigourTitle: 'أبحاث سريرية محكمة 100%',
      clinicalRigourDesc: 'مستندة إلى تجارب بشرية سريرية مدققة ومطابقة للمعايير الصحية.',
      microDoseTitle: 'الخطوات الميسّرة في 3 دقائق',
      microDoseDesc: 'بدائل حركية مكيّفة داخل الأماكن المغلقة عند اشتداد درجات الحرارة إلى 48° مئوية أو ضغط العمل.'
    },
    simulator: {
      tag: 'محاكي السلوك الصحي التفاعلي',
      title: 'لماذا تفشل تطبيقات العادات التقليدية في بيئة الخليج؟',
      subtitle:
        'شاهد الفرق بين صرامة التطبيقات التقليدية التي تؤدي إلى التوقف المفاجئ، وبين مرونة فيسكوتو التي تحافظ على التزامك الصحي.',
      barrierLabel: 'اختر أحد التحديات اليومية في أبوظبي:',
      barrierHeat: 'حرارة الصيف الظهيرة 48° مئوية',
      barrierShift: 'نوبة عمل إضافية 14 ساعة في المستشفى أو قطاع الطاقة',
      barrierRamadan: 'صيام شهر رمضان وساعات الصلاة المتأخرة',
      traditionalAppTitle: 'التطبيق التقليدي الصارم',
      traditionalResultTitle: 'انقطاع السلسلة: اليوم 0',
      traditionalResultBody:
        'تعذّر أداء 45 دقيقة كاملة. انقطعت السلسلة وعاد العداد إلى الصفر، مما يصيب 82% من المستخدمين بالإحباط وترك العادة نهائياً.',
      traditionalBadge: 'عقاب ثنائي صارم',
      viskotuAppTitle: 'محرك فيسكوتو التكيفي',
      viskotuResultTitle: 'استمرار السلسلة: اليوم 19 محفوظ',
      viskotuResultBody:
        'تم رصد التحدي فوراً. تقلّصت الخطة اليومية تلقائياً إلى خطوة ميسّرة مدتها 4 دقائق داخل المكان المكيّف، دون لوم وحفاظاً على العزم الإيجابي.',
      viskotuBadge: 'خطوة ميسّرة ذكية',
      tryActionText: 'جرّب تحدياً آخر'
    },
    pillarsTitle: 'الركائز الأساسية لتعزيز الصحة في بيئة الخليج',
    pillarsSubtitle:
      'صُممت خصيصاً لمراعاة الواقع البيئي والمناخي ونمط الحياة في أبوظبي ودولة الإمارات.',
    pillar1: {
      tag: 'التكيف المناخي',
      title: 'التكيف الحراري والبيئي',
      body: 'تجاوز درجات الحرارة 45° مئوية صيفاً يجعل الرياضة الخارجية محفوفة بالمخاطر. يستبدل فيسكوتو الخطوات الخارجية بتمارين حركية داخلية مكيّفة بسلاسة تامة.'
    },
    pillar2: {
      tag: 'التزامن الإيقاعي',
      title: 'التزامن الحيوي في شهر رمضان',
      body: 'تنظيم مواعيد شرب المياه والنشاط والتعرض للضوء حول فترات السحور والإفطار لدعم الصحة الأيضية وتجنب الجفاف.'
    },
    pillar3: {
      tag: 'الحد من أضرار التبغ',
      title: 'الإقلاع عن المدواخ والدخة والشيشة',
      body: 'خطط إحلال سلوكية مثبتة إكلينيكياً لاستهداف عادة تدخين المدواخ والدخة الغنية بالنيكوتين ومحفزات الشيشة الاجتماعية.'
    },
    protocolsTitle: 'خطط صحية مخصصة لأبوظبي',
    protocolsSubtitle:
      'خطط صحية محكمة ومضبوطة مسبقاً، جاهزة للتطبيق والتتبع الفوري في المتصفح.',
    protocolCards: {
      heat: {
        title: 'خطة التكيف الحراري والإيقاع الحيوي',
        institution: 'كليفلاند كلينك / إرشادات الكلية الأمريكية للطب الرياضي',
        duration: '28 يوماً · يومياً',
        action: 'التعرض للضوء الطبيعي قبل 8 صباحاً + تدريبات ثبات حركي داخلية',
        tag: 'التكيف الحراري'
      },
      ramadan: {
        title: 'الاستقرار الأيضي في شهر رمضان المبارك',
        institution: 'جمعية الغدد الصماء الخليجية / لانسيت للسكري',
        duration: '30 يوماً · شهر رمضان',
        action: 'نشاط حركي خفيف بعد الإفطار + تنظيم السوائل بطيئة الامتصاص في السحور',
        tag: 'التزامن الحيوي'
      },
      midwakh: {
        title: 'برنامج التدرج السلوكي للإقلاع عن المدواخ والدخة',
        institution: 'مركز أبوظبي للصحة العامة / قاعدة كوكرين للإدمان',
        duration: '42 يوماً · 6 مراحل',
        action: 'تقنية ركوب موجة الرغبة + البدائل الحركية + خفض وتيرة التدخين أسبوعياً',
        tag: 'الحد من الأضرار'
      }
    },
    launchProtocolCta: 'بدء الخطة في التطبيق',
    clinicalBriefTitle: 'ملخص سريري جاهز للطبيب المعالج',
    clinicalBriefSubtitle:
      'تصدير تقرير التزام احترافي من صفحة واحدة لمناقشته في مراجعتك الطبية لدى كليفلاند كلينك أبوظبي أو مدينة الشيخ شخبوط الطبية أو مراكز صحة (SEHA).',
    clinicalBriefPoints: [
      'مخطط زمني بياني لمعدل الالتزام والتحول للخطوات الميسّرة واستعادة النشاط',
      'سجل القياسات الحيوية وردود الفعل (الألم، الطاقة، جودة النوم) ومقارنتها بالجرعات',
      'معايير الأمان المعتمدة وموانع الاستخدام المربوطة بمصادر الأبحاث السريرية المعتمدة'
    ],
    ctaBannerTitle: 'جاهز لاستدامة سلوكياتك الصحية في أبوظبي؟',
    ctaBannerSubtitle:
      'انضم إلى مجتمع المشاركين والأطباء المعتمدين على الخطوات الميسّرة القائمة على الأدلة. دون الحاجة لبطاقة ائتمان أو إعداد معقد.',
    ctaBannerButton: 'ابدأ تجربة أبوظبي الصحية — مجاناً'
  }
};
