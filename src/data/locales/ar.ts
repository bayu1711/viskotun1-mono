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
      'بروتوكولات سريرية',
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
    skipToContent: 'الانتقال إلى المحتوى الرئيسي',
    streak: (days: number) =>
      days === 1
        ? 'يوم التزام واحد'
        : days === 2
        ? 'يومان من الالتزام'
        : days <= 10
        ? `${days} أيام التزام`
        : `${days} يوماً من الالتزام`,
    addPaper: 'إضافة بحث سريري',
    searchPlaceholder: 'ابحث في الأبحاث والخطط السريرية...',
    resetDemo: 'إعادة ضبط التجربة',
    syncing: 'جارٍ المزامنة السحابية...',
    offline: 'العمل في وضع عدم الاتصال',
    closeHowTo: 'إغلاق نافذة الإرشادات'
  },
  switcher: {
    label: 'تبديل الخطة الصحية',
    active: 'الخطة النشطة',
    completed: 'مكتملة',
    switchAction: 'تفعيل'
  },
  papers: {
    eyebrow: 'البروتوكول السريري',
    title: 'الخطة اليومية',
    currentDay: (day: number, total: number) => `اليوم ${day} من ${total}`,
    targetToday: 'المستهدف لليوم',
    allCompleted: 'أحسنت! أكملت جميع الخطوات المقررة لليوم.',
    momentumScore: (momentum: number) => `مؤشر الالتزام ${momentum}%`,
    activeProtocol: 'البروتوكول السريري النشط'
  },
  routine: {
    eyebrow: 'الخطة السريرية',
    title: 'الخطة اليومية',
    dayLabel: (day: number) => `اليوم ${day}`,
    dayFraction: (current: number, total: number) => `اليوم ${current} من ${total}`,
    completionLabel: (percent: number) => `${percent}% منجز اليوم`,
    emptyTitle: 'لا توجد خطة نشطة حالياً',
    emptyBody: 'قم برفع ورقة بحثية سريرية أو اختر من الأبحاث الرائجة لبدء خطتك اليومية.',
    allDoneToday: 'أحسنت! تم إنجاز جميع متطلبات اليوم بنجاح.',
    momentumBadge: (score: number) => `زخم الالتزام: ${score}%`,
    streakBadge: (streak: number) => `${streak} أيام التزام مستمر`
  },
  reEntry: {
    badge: 'مرحباً بعودتك',
    title: 'استئناف الخطة بسلاسة',
    eyebrow: 'استعادة النشاط',
    welcomeBackDays: (days: number) =>
      days === 1
        ? 'مرحباً بعودتك! بعد يوم من التوقف، تقدمك وسلسلة التزامك محفوظة بالكامل دون أي خصم.'
        : `مرحباً بعودتك! بعد ${days} أيام من التوقف، تقدمك وسلسلة التزامك محفوظة بالكامل دون أي خصم.`,
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
    nonPunitiveAssurance:
      'المرونة هي جوهر الاستدامة السلوكية. بدلاً من إعادة البدء من الصفر، يمكنك اختيار مستوى الإنجاز المناسب لظروفك اليوم لاستعادة زخم النشاط بسلاسة.',
    barrierPrompt: 'ما الذي حال دون إتمام خطتك خلال الأيام السابقة؟ (اختياري - يساعدنا على مواءمة خطتك):',
    barrierTypes: {
      fatigue: 'إرهاق عام أو قلة نوم',
      pain_flare: 'زيادة الشعور بالإجهاد أو عدم الارتياح',
      busy_work: 'ضغط العمل أو نوبات دوام طويلة',
      travel: 'سفر أو تنقل خارج الروتين المعتاد',
      low_motivation: 'تراجع الحافز مؤقتاً',
      ramadan_fasting: 'التكيف مع ساعات صيام رمضان',
      gulf_heat: 'ارتفاع درجات الحرارة نهاراً',
      other: 'ظرف أو مانع آخر'
    },
    barrierOtherPlaceholder: 'صف العائق باختصار (مثال: جدول نوبات ليلية متقلب)...',
    chooseDoseLabel: 'اختر نمط الإنجاز لليوم:',
    resumeButton: 'متابعة الخطة اليومية',
    dismissButton: 'سأبدأ مباشرة',
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
    microNotice: 'الخطوة الميسّرة مفعلة: أنجز مجموعة واحدة لتحقيق نسبة 100% لإنجاز اليوم.',
    badge: 'نمط الإنجاز اليومي',
    selectorLabel: 'اختر حجم جلسة اليوم',
    standardTitle: 'الجرعة الكاملة',
    standardDesc: 'تنفيذ جميع المجموعات والتكرارات المقررة بالكامل في البحث السريري.',
    microTitle: 'الخطوة الميسّرة (30-40%)',
    microDesc:
      'تنفيذ جلسة واحدة مصغّرة للحفاظ على استمرارية العادة السلوكية وزخم الالتزام دون إجهاد بدني.',
    restTitle: 'استراحة واستشفاء نشط',
    restDesc: 'تسجيل يوم استشفاء إيجابي مع الحفاظ التام على سلسلة التزامك دون انقطاع.',
    activeBadge: 'النمط المفعل لليوم',
    switchSuccess: (mode: string) => `تم تحويل جلسة اليوم إلى نمط: ${mode}`
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
    eyebrow: 'التقييم الذاتي السريري',
    title: 'تسجيل الاستجابة الحيوية',
    scorePrompt: 'ما مدى شعورك بعدم الارتياح أو الإجهاد أثناء إنجاز خطوات اليوم؟',
    scoreLowHint: '0-3: استجابة ممتازة ضمن النطاق المستهدف',
    scoreMidHint: '4-6: إجهاد ملحوظ — قد يلزم تثبيت الشدة',
    scoreHighHint: '7-10: عدم ارتياح مرتفع — سيتم خفض الحمل تلقائياً غداً',
    saveButton: 'حفظ التقييم والمتابعة',
    closeButton: 'إلغاء'
  },
  task: {
    setsCompleted: (done: number, total: number) => `${done} من ${total} مجموعات منجزة`,
    logSet: 'تسجيل مجموعة',
    viewDetails: 'عرض التفاصيل والتقنية السريرية',
    safetyStopRule: 'قاعدة إيقاف الأمان:',
    taskQuestionPrompt: (action: string) => `كيف أنفذ "${action}" بالطريقة السريرية الصحيحة؟`
  },
  community: {
    eyebrow: 'المجتمع والبيانات الواقعية',
    title: 'أدلة الفعالية الواقعية',
    activeTab: 'نتائج الخطة النشطة',
    exploreTab: 'استكشاف الأبحاث الرائجة',
    goToRoutine: 'الانتقال إلى خطتي اليومية',
    trackButton: 'متابعة الخطة',
    defaultProtocolTitle: 'بروتوكول بحثي',
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
    stagingEyebrow: 'البروتوكول المستخرج',
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
    title: 'رفع ورقة بحثية سريرية',
    dropzone: 'اسحب ملف الـ PDF هنا أو اضغط للاختيار',
    supportedFormats: 'يدعم ملفات PDF للتجارب السريرية البشرية المنشورة',
    invalidType: 'نوع الملف غير صالح. يرجى رفع ملف PDF فقط.'
  },
  auth: {
    welcome: 'مرحباً بك في ڤيسكوتو N1',
    subtitle: 'تسجيل الدخول لمزامنة خططك السريرية وتتبع التزامك',
    emailLabel: 'البريد الإلكتروني',
    passwordLabel: 'كلمة المرور',
    signInButton: 'تسجيل الدخول',
    signUpButton: 'إنشاء حساب جديد',
    guestButton: 'المتابعة كضيف',
    signOut: 'تسجيل الخروج',
    defaultGuestName: 'مشارك سريري',
    signInToSyncBadge: 'سجل الدخول للمزامنة',
    adminBadge: 'مشرف'
  },
  howTo: {
    dialogLabel: 'دليل الاستخدام والأبحاث الرائجة',
    close: 'إغلاق الدليل',
    eyebrow: 'إرشادات الاستخدام',
    title: 'كيف تحول أبحاث العلوم الإنسانية إلى خطط يومية'
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
  }
};
