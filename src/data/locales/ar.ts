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
    title: 'TrialN1 // أبحاث الذكاء الاصطناعي والخطط الصحية اليومية',
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
    openGraphTitle: 'TrialN1 // أبحاث الذكاء الاصطناعي والخطط الصحية اليومية',
    openGraphDescription:
      'تحويل أوراق البحث المعقدة إلى خطط صحية يومية قابلة للتنفيذ مع N1 AI، رفيق الأمان التكيفي.'
  },
  brand: {
    mark: '//',
    name: 'TrialN1',
    initials: 'TN1'
  },
  greeting: {
    morning: 'صباح الخير،',
    afternoon: 'مساء الخير،',
    evening: 'مساء النور،'
  },
  common: {
    percentComplete: (percent: number) => `اكتمل بنسبة ${percent}%`,
    opensInNewTab: '(يفتح في علامة تبويب جديدة)',
    percentSign: '%'
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
    addPaper: 'روتين جديد',
    openAssistant: 'اسأل N1',
    openProfile: 'فتح الملف الشخصي وإعدادات نمط الحياة التكيفي',
    resetDemo: 'إعادة ضبط التجربة',
    assistantFab: (title: string) => `اسأل N1 عن ${title} أو ارفع ملف PDF`,
    todaySummaryLabel: 'تقدم اليوم',
    noActiveRoutine: 'لا توجد خطة نشطة',
    noActivePrompt: 'قم برفع ورقة بحثية أو استكشف الخطط الرائجة لبدء المتابعة.',
    dayOfTotal: (day: number, total: number) => `اليوم ${day} / ${total}`,
    dropTitle: 'اسحب للاستخراج الفوري',
    dropSubtitle: 'سنعزل منهجية الدراسة ونبني خطتك الصحية',
    dropScope: 'أبحاث سريرية بشرية تداخلية · تجارب منضبطة وخطط سلوكية',
    switchLanguageTo: (label: string) => `التحويل إلى ${label}`,
    languageMenuLabel: 'اللغة',
    primaryBadge: 'أساسية',
    secondaryBadge: 'ثانوية',
    manageLanguages: 'إعدادات اللغة'
  },
  switcher: {
    heading: 'خططك الصحية',
    addPaper: 'بدء روتين جديد',
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
      'تقنيات معتمدة أكاديمياً لتعديل السلوك الصحي (Michie et al. 2013) مدمجة في خطط وبرامج TrialN1.',
    dialogLabel: 'سجل تقنيات تغيير السلوك',
    closeButton: 'إغلاق السجل',
    clusterLabel: 'تصنيف التقنية السلوكية',
    mechanismLabel: 'الآلية النفسية والعصبية',
    implementationLabel: 'التطبيق العملي في N1 AI',
    targetBarriersLabel: 'عوائق بيئة الخليج المستهدفة',
    openLedgerButton: 'استعراض تصنيف BCT السلوكي'
  },
  healthAge: {
    eyebrow: 'الأثر السريري',
    title: 'توقع العمر الصحي الحيوي',
    projectedAgeLabel: 'العمر الصحي المتوقع',
    deltaLabel: (delta: number) => `أصغر بـ ${Math.abs(delta)} سنوات بيولوجياً`,
    baselineAgeLabel: (age: number) => `العمر الزمني المرجعي: ${age} سنة`,
    sustainedBasis: (days: number) => `بناءً على ${days} يوماً من الاستمرارية في العادة`,
    cvdRiskLabel: 'انخفاض مخاطر القلب والأوعية الدموية',
    metabolicRiskLabel: 'انخفاض مخاطر المتلازمة الأيضية',
    resilienceLabel: 'مؤشر مرونة العادة السلوكية',
    resilienceCaption: 'معدل تحويل المعوقات لخطوات ميسّرة واستدامة الالتزام',
    bctLinkText: 'الاطلاع على تقنيات BCT المعتمدة',
    setAgeLink: 'تخصيص العمر'
  },
  profile: {
    eyebrow: 'الملف الشخصي والبيئة اليومية',
    title: 'الملف الشخصي ونمط الحياة التكيفي',
    subtitle: 'تساعد بياناتك الأساسية وجدولك اليومي في تخصيص توقع العمر الصحي وتنبيهات التقويم وتكييف الخطط العلاجية.',
    backToRoutine: 'العودة إلى خطة اليوم',
    tabs: {
      ariaLabel: 'أقسام الملف الشخصي',
      account: 'الحساب',
      lifestyle: 'نمط الحياة',
      data: 'البيانات وإدارة الحساب'
    },
    saveButton: 'حفظ الملف الشخصي',
    saveAccountButton: 'حفظ إعدادات الحساب',
    saveLifestyleButton: 'حفظ نمط الحياة',
    unsavedChanges: 'تغييرات غير محفوظة',
    allChangesSaved: 'تم حفظ كل التغييرات',
    savedToast: 'تم حفظ الملف الشخصي ونمط الحياة بنجاح',
    tuneWithAi: 'التخصيص عبر N1 AI',
    userProfileEyebrow: 'بياناتك',
    userProfileTitle: 'الهوية والأساس الفسيولوجي',
    displayNameLabel: 'الاسم المعروض',
    displayNamePlaceholder: 'اسمك أو اللقب المفضل',
    ageLabel: 'العمر الزمني (بالسنوات)',
    agePlaceholder: 'مثال: 34',
    ageHint: 'يُستخدم لحساب توقع العمر الصحي الحيوي المخصص لك في لوحة المؤشرات.',
    sexLabel: 'الجنس البيولوجي',
    sexOptions: {
      female: 'أنثى',
      male: 'ذكر',
      other: 'آخر',
      prefer_not_to_say: 'أفضل عدم التحديد'
    },
    availabilityLabel: 'الفترات الزمنية المتاحة يومياً',
    availabilityHint:
      'تُستخدم لمطابقة قواعد التوقيت السريرية في كل بحث (التباعد مرتين يومياً، التوقيت الصباحي، أو السجل المسائي) وتصدير التقويم. يمكنك تخصيص أي خطة بمفردها كـ «في أي وقت» أو بفترات مخصصة.',
    availabilityModes: {
      windows: 'فترات محددة',
      anytime: 'مرن / في أي وقت'
    },
    availabilityAnytimeDesc:
      'لا توجد أوقات افتراضية ثابتة — تبقى الخطط مرنة ما لم يتطلب البحث توقيتاً بيولوجياً محدداً يمكنك مراجعته قبل البدء.',
    addWindowBtn: '+ إضافة فترة متاحة',
    removeWindowAria: (label: string) => `إزالة فترة ${label}`,
    windowLabelPlaceholder: 'الاسم (مثال: الصباح)',
    windowPresetsHeading: 'إضافة سريعة',
    availabilityPresets: [
      { id: 'morning', label: 'الصباح', start: '07:30', end: '09:00' },
      { id: 'midday', label: 'الظهيرة', start: '12:30', end: '13:30' },
      { id: 'evening', label: 'المساء', start: '19:00', end: '21:00' }
    ],
    fastingAvailabilityPreset: { id: 'post-iftar', label: 'بعد الإفطار', start: '20:30', end: '22:00' },
    dawnAvailabilityPreset: { id: 'dawn', label: 'الفجر', start: '05:30', end: '07:00' },
    lateDinnerAvailabilityPreset: { id: 'post-dinner', label: 'بعد العشاء', start: '21:30', end: '22:30' },
    goalsLabel: 'الهدف الصحي أو التأهيلي الأساسي',
    goalsPlaceholder: 'يُنشأ تلقائياً من ملف نمط الحياة — أو يمكنك تعديله هنا',
    goalsGenerateBtn: 'توليد من نمط الحياة',
    goalsHint: 'يتكيف تلقائياً مع ملف نمط الحياة التكيفي ويُرسل مباشرة إلى N1 AI.',
    languageSectionLabel: 'لغة التطبيق ومبدّل الشريط العلوي',
    primaryLanguageLabel: 'اللغة الأساسية',
    secondaryLanguageLabel: 'اللغة الثانوية',
    secondaryLanguageNone: 'بدون (لغة واحدة)',
    languageHint: 'يتيح الشريط العلوي التبديل السريع بين لغتك الأساسية والثانوية. اختر «بدون» لاستخدام لغة واحدة فقط.',
    lifestyleEyebrow: 'مشترك مع N1 AI',
    lifestyleTitle: 'ملف نمط الحياة التكيفي',
    lifestyleSyncNote:
      'يقرأ N1 AI هذه الحقول نفسها ويعدّلها. ما تخبره به في المحادثة يظهر هنا، وما تحفظه هنا يوجّه إجاباته.',
    regionLabel: 'المنطقة والمدينة',
    countryPlaceholder: 'الدولة (مثال: اليابان، البرازيل، الإمارات، ألمانيا)',
    countryAria: 'الدولة',
    cityPlaceholder: 'المدينة (مثال: أبوظبي، دبي، الرياض)',
    regionConfirmed: 'مؤكد',
    workPatternLabel: 'نمط العمل',
    workPatterns: {
      standard: 'دوام نهاري قياسي',
      shift_work: 'مناوبات صحية / ورديات',
      desk_sedentary: 'عمل مكتبي (+8 ساعات)',
      frequent_travel: 'سفر وتنقل متكرر',
      flexible: 'جدول مرن'
    },
    activityLabel: 'مستوى النشاط الأساسي',
    activityLevels: {
      sedentary: 'خامل',
      light: 'خفيف',
      moderate: 'معتدل',
      active: 'نشيط'
    },
    smokingLabel: 'التدخين والتبغ',
    smokingOptions: {
      non_smoker: 'غير مدخن',
      midwakh_dokha: 'مدواخ / دوخة',
      shisha_waterpipe: 'شيشة / أرجيلة',
      cigarettes: 'سجائر',
      vape: 'فيب / إلكتروني',
      former_smoker: 'مدخن سابق',
      other: 'أخرى'
    },
    climateLabel: 'التعرض للمناخ والحرارة',
    climateOptions: {
      summer_heat: 'حرارة الصيف الشديدة',
      moderate: 'معتدل / داخلي',
      cold_climate: 'مناخ بارد'
    },
    ramadanLabel: 'صيام شهر رمضان المبارك',
    ramadanDesc: 'يعيد جدولة الجهد البدني والترطيب والإرشاد اليومي بما يتناسب بأمان مع ساعات الصيام.',
    culturalRhythmsLabel: 'الإيقاعات الثقافية والأسرية (في أي دولة)',
    culturalRhythmsHint: 'تختلف الثقافات والعادات اليومية بين الأسر في كل بلد — اختر كل ما يناسب روتينك الأسبوعي.',
    culturalRhythmOptions: {
      ramadan_fasting: 'صيام رمضان (السحور / الإفطار)',
      intermittent_fasting: 'صيام متقطع (16:8)',
      periodic_religious_fasting: 'صيام دوري أو تقليدي (أسبوعي / مواسم)',
      late_family_dinner: 'عشاء عائلي متأخر (+21:00)',
      early_dawn_riser: 'استيقاظ مبكر وقت الفجر',
      midday_siesta_rest: 'قيلولة أو راحة منتصف اليوم',
      sabbath_weekly_rest: 'يوم راحة أسبوعي مخصص',
      collectivist_household: 'أسرة ممتدة / جدول عائلي مشترك'
    },
    cautionsLabel: 'ملاحظات واحتياطات بدنية',
    cautionsHint: 'اختر ما ينطبق عليك أو أضف ملاحظتك. يستخدم المساعد الذكي القائمة نفسها.',
    cautionLabels: {
      'Morning stiffness': 'تيبس صباحي',
      'Knee sensitivity': 'حساسية الركبة',
      'Lower back sensitivity': 'حساسية أسفل الظهر',
      'Shoulder mobility limit': 'محدودية حركة الكتف',
      'Ankle / Achilles tenderness': 'ألم الكاحل / وتر أخيل',
      'Hip stiffness': 'تيبس الورك',
      'Neck tension': 'شد الرقبة',
      'Wrist sensitivity': 'حساسية المعصم',
      'Joint sensitivity': 'حساسية المفاصل',
      'Heat fatigue': 'إجهاد حراري'
    },
    customCautionPlaceholder: 'أضف ملاحظة أخرى (مثال: ألم باطن القدم)',
    customCautionAria: 'إضافة احتياط بدني',
    addCautionBtn: 'إضافة',
    removeCautionAria: (caution: string) => `إزالة ${caution}`,
    activeTagsLabel: 'الوسوم التكيفية النشطة',
    activeTagsHint: 'تُبنى من الحقول أعلاه ومن العادات التي تذكرها لـ N1 AI.',
    removeTagAria: (tag: string) => `إزالة ${tag}`,
    managedTagLabels: {
      healthcare_shift_worker: 'عمل بنظام النوبات',
      desk_bound_worker: 'عمل مكتبي طويل',
      frequent_traveler: 'سفر متكرر',
      midwakh_dokha: 'مدواخ / دوخة',
      shisha_waterpipe: 'شيشة / أرجيلة',
      cigarette_smoker: 'سجائر',
      vape_user: 'سيجارة إلكترونية',
      extreme_heat_summer: 'حر الصيف الشديد',
      cold_climate_winter: 'مناخ بارد'
    },
    noTagsYet: 'فعّل أياً من العوامل أعلاه أو استخدم التخصيص الذكي لإضافة وسوم السياق.',
    impactEyebrow: 'ترابط ذكي عبر TrialN1',
    impactTitle: 'كيف يخصص هذا تجربتك',
    impactAgeItem: (age: number, isCustom: boolean) =>
      `يعتمد العمر الصحي على عمر ${age} سنة (${isCustom ? 'عمرك المحفوظ' : 'المرجع الافتراضي'}).`,
    impactAvailabilityItem: (summary: string) =>
      `تُطابق الأبحاث الجديدة ملاءمة الجدول وفترات التقويم مع: ${summary}.`,
    impactCohortItem: (cohort: string) =>
      `تُصنف مراجعات المجتمع ضمن فئة "${cohort}".`,
    impactLanguageItem: (primaryLabel: string, secondaryLabel?: string) =>
      secondaryLabel
        ? `يتيح الشريط العلوي التبديل السريع بين ${primaryLabel} و${secondaryLabel}.`
        : `تستخدم الواجهة ${primaryLabel} فقط (مبدّل الشريط العلوي مخفي).`,
    accountCardTitle: 'الحساب والمزامنة السحابية',
    accountStatusActive: 'نشط',
    accountStatusGuest: 'ضيف',
    memberSinceLabel: 'عضو منذ',
    storedDataSummary: (routineCount: number, logCount: number) =>
      `${routineCount} خطط · ${logCount} سجلات محفوظة`,
    guestNotice: 'أنت تتصفح كضيف. تُحفظ التفضيلات محلياً — سجل الدخول للمزامنة عبر أجهزتك.',
    signedInNotice: (email: string) => `تم تسجيل الدخول عبر ${email}. تتم مزامنة خططك وملفك تلقائياً.`,
    signInCta: 'سجل الدخول للمزامنة',
    signOutBtn: 'تسجيل الخروج',
    passwordResetBtn: 'إرسال رابط إعادة تعيين كلمة المرور',
    passwordResetSentToast: (email: string) => `تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}`,
    passwordResetUnavailableToast: 'إعادة تعيين كلمة المرور متاحة فقط لحسابات البريد الإلكتروني وكلمة المرور.',
    privacyPreferencesLabel: 'تفضيلات الإشعارات والخصوصية',
    reminderNotificationsLabel: 'تذكيرات الخطة اليومية',
    reminderNotificationsDesc: 'تضمين تنبيهات التذكير اليومية في التقويمات المصدّرة وموجهات الخطة.',
    communityCohortOptInLabel: 'مشاركة مؤشرات الفئة بشكل مجهول الهوية',
    communityCohortOptInDesc: 'السماح باستخدام فئة نمط الحياة لتحسين مقارنات الالتزام المجتمعية المجهولة.',
    dataPrivacyEyebrow: 'البيانات وإدارة الحساب',
    dataPrivacyTitle: 'بياناتك ودورة حياة الحساب',
    dataPrivacySubtitle: 'قم بتنزيل نسخة كاملة من سجلاتك، أو ابدأ من جديد، أو أوقف حسابك مؤقتاً، أو احذفه نهائياً.',
    exportDataTitle: 'تصدير بياناتك',
    exportDataDesc: 'تنزيل نسخة JSON محمولة تتضمن ملفك الشخصي ونمط حياتك التكيفي وخططك وسجلات التقييم اليومية.',
    exportDataBtn: 'تصدير JSON',
    exportDataSuccessToast: 'تم تنزيل نسخة بيانات TrialN1 الخاصة بك.',
    clearDataTitle: 'مسح جميع البيانات',
    clearDataDesc: 'يحذف جميع الخطط المتابعة والتقدم اليومي وسجلات الأعراض والمحادثات ويعيد الإعدادات للافتراضي مع بقاء حسابك نشطاً.',
    clearDataBtn: 'مسح جميع البيانات',
    clearDataConfirmTitle: 'هل تريد مسح جميع الخطط والسجلات والتفضيلات؟',
    clearDataConfirmBody: 'سيؤدي هذا إلى إعادة تعيين خططك وسجل التقييمات ومحادثات المساعد وإعدادات نمط الحياة على هذا الجهاز والمزامنة السحابية مع بقاء تسجيل دخولك نشطاً.',
    clearDataConfirmBtn: 'تأكيد مسح جميع البيانات',
    clearDataSuccessToast: 'تم مسح جميع بيانات الخطط وإعادة تعيين التفضيلات.',
    deactivateTitle: 'تعطيل الحساب مؤقتاً',
    deactivateDesc: 'إيقاف حسابك مؤقتاً وتسجيل الخروج. تبقى خططك وسجلاتك محفوظة بأمان وتعود للعمل تلقائياً عند تسجيل الدخول مجدداً.',
    deactivateGuestHint: 'التعطيل متاح للحسابات المسجلة فقط. كضيف، يمكنك استخدام مسح جميع البيانات أو تسجيل الدخول لإنشاء حساب متزامن.',
    deactivateBtn: 'تعطيل الحساب',
    deactivateConfirmTitle: 'هل تريد إيقاف وتعطيل حسابك مؤقتاً؟',
    deactivateConfirmBody: 'ستتوقف المزامنة والتذكيرات وسيتم تسجيل خروجك. يمكنك تسجيل الدخول مجدداً في أي وقت بنفس البريد لإعادة تفعيل حسابك واستعادة بياناتك.',
    deactivateConfirmBtn: 'تأكيد التعطيل',
    deactivatedToast: 'تم تعطيل الحساب. سجل الدخول في أي وقت لإعادة تفعيله.',
    deleteTitle: 'حذف الحساب نهائياً',
    deleteDesc: 'حذف حساب TrialN1 الخاص بك وجميع الخطط وسجلات الأعراض والملف الشخصي بشكل دائم لا يمكن التراجع عنه.',
    deleteGuestDesc: 'مسح ملف الضيف المحلي وجميع الخطط والسجلات من هذا الجهاز والعودة لصفحة تسجيل الدخول.',
    deleteBtn: 'حذف الحساب',
    deleteConfirmTitle: 'هل تريد حذف حسابك نهائياً؟',
    deleteConfirmBody: 'سيتم محو جميع الخطط وسجلات الالتزام والمحادثات وإعدادات الملف الشخصي بشكل دائم ولا يمكن استعادتها.',
    deleteConfirmKeyword: 'DELETE',
    deleteConfirmInputLabel: 'اكتب DELETE لتأكيد الحذف النهائي',
    deleteConfirmInputPlaceholder: 'DELETE',
    deleteConfirmBtn: 'تأكيد الحذف النهائي للحساب',
    deletedToast: 'تم حذف حسابك وجميع البيانات المرتبطة به نهائياً.',
    actionErrorToast: 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',
    cancelBtn: 'إلغاء',
    workingLabel: 'جاري التنفيذ…'
  },
  reEntry: {
    badge: 'مرحباً بعودتك',
    title: 'استئناف الخطة بسلاسة',
    subtitle: (days: number) =>
      days > 1
        ? `توقفت لمدة ${days} أيام. الانقطاعات المؤقتة جزء طبيعي تماماً من بناء العادات الصحية طويلة الأمد. دعنا نكيّف خطة اليوم للحفاظ على زخم التزامك.`
        : 'دعنا نكيّف خطة اليوم لتناسب ظروفك الحالية ومستوى طاقتك.',
    question: 'ما الذي استجد أو حال دون إتمام خطتك؟',
    barrierHint: 'تسجيل العوائق يساعد N1 AI على فهم جدولك وتقديم توصيات استشفاء مخصصة لك.',
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
    microNotice: 'الخطوة الميسّرة مفعلة: أنجز مجموعة واحدة لتحقيق نسبة 100% لإنجاز اليوم.',
    modalTitle: 'نمط إنجاز اليوم',
    modalSubtitle:
      'اختر وتيرة إنجاز اليوم. الخطوة الميسّرة تقلل المجموعات المطلوبة للحفاظ على وتيرة الالتزام، والاستشفاء النشط يسجل الراحة دون أي تأثير على تقدمك.',
    openModalButton: 'نمط إنجاز اليوم',
    reEntryPrompt: 'تعطل جدولك؟ تكييف الخطة'
  },
  lifestyleTuning: {
    badge: 'نمط حياتك',
    title: 'الملف السلوكي والبيئي المتكيف',
    tuneButton: 'تخصيص الخطة للسياق',
    topBarPill: (region: string, tagCount: number) =>
      tagCount > 0 ? `${region} · ${tagCount} عوامل مخصصة` : `${region} · تخصيص الخطة`,
    detectedLocationGreeting: (country: string, city?: string) =>
      `مرحباً بك! نلاحظ أنك تتابع خطتك من ${city ? `${city}، ` : ''}${country}. هل هذا دقيق؟`,
    unknownLocationGreeting:
      'مرحباً بك! من أي مدينة أو منطقة تتابع خطتك؟ يساعدنا تحديد موقعك على مواءمة خطتك مع المناخ، وساعات الصيام، ونمط العمل المحلي.',
    confirmLocationBtn: (cityOrCountry: string) => `نعم، ${cityOrCountry}`,
    changeLocationBtn: 'تغيير المنطقة',
    customPromptPlaceholder:
      'اكتب أو تحدث: مثال "أعمل بنظام النوبات الليلية في المستشفى وأدخن الشيشة في العطلات"...',
    suggestionsEyebrow: (region: string) => `عوامل ثقافية ومجتمعية متنوعة في ${region}`,
    tagAddedToast: (tag: string) => `تمت إضافة "${tag}" إلى ملفك الصحي`,
    tagRemovedToast: (tag: string) => `تمت إزالة "${tag}" من ملفك الصحي`,
    regionUpdatedReply: (regionLabel: string) =>
      `تم تحديث المنطقة إلى ${regionLabel}. أصبح توقيت روتينك ووتيرته يتبعان مناخك المحلي ويومك.`,
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
    filterShiftWork: 'العاملون بنظام النوبات',
    onboarding: {
      badge: (step: number, total: number) => `إعداد موجه · ${step} من ${total}`,
      skipBtn: 'تخطي الآن',
      nextBtn: 'متابعة',
      backBtn: 'رجوع',
      finishBtn: 'إتمام وتكييف الخطة',
      rerunBtn: 'تحديث نمط الحياة',
      completedToast: 'تم تخصيص ملف نمط الحياة التكيفي بنجاح!',
      answerSource: 'نمط الحياة التكيفي',
      greetingRegion: (regionLabel: string) =>
        `مرحباً! يسعدني تكييف خطتك اليومية لتناسب إيقاع حياتك الفعلي. رصدت أنك في ${regionLabel} — هل هذا صحيح، أم أنك تتابع خطتك من مكان آخر؟`,
      askAge:
        'كم عمرك؟ تعاير TrialN1 معايير السلامة ونطاقات معدل ضربات القلب والجرعات المرجعية وفقاً لفئتك العمرية.',
      askAvailability:
        'متى تكون متاحاً عادةً خلال اليوم؟ اختر فترة أو فترتين مفتوحتين (مثل 7:30–9 صباحاً و7–9 مساءً) أو اكتب «في أي وقت» — سأطابق قواعد توقيت كل بحث مع أوقاتك المتاحة.',
      askAgeTime:
        'كم عمرك، ومتى تكون متاحاً عادةً خلال اليوم؟ شاركني فترة أو فترتين مفتوحتين (مثل 7:30–9 صباحاً و7–9 مساءً) أو اكتب «في أي وقت» — سأطابق قواعد توقيت كل بحث مع أوقاتك المتاحة.',
      askRhythm: (regionLabel: string) =>
        `كيف يبدو يومك المعتاد في ${regionLabel}؟ أخبرني عن ساعات عملك أو المناخ أو أي إيقاعات ثقافية وأسرية مثل العمل بنظام النوبات أو العمل المكتبي أو الصيام أو الاستيقاظ المبكر أو العشاء المتأخر.`,
      askCautions:
        'سؤال أخير: هل لديك أي حساسية في المفاصل (مثل الركبتين أو أسفل الظهر أو الكتفين) أو عادات تدخين أحتاج لمراعاتها بأمان؟',
      completionSummary: (focus: string) =>
        `تم كل شيء — تمت معايرة ملف نمط حياتك المتكيف بنجاح! قمت بضبط تركيز خطتك حول: ${focus}. الخطوة التالية: استكشف الأبحاث والروتينات المتوافقة مع احتياجاتك، أو راسلني في أي وقت لتعديل جدولك أو موقعك أو عاداتك.`,
      returningGreeting: (regionLabel: string, summary: string) =>
        `ملفك مخصص حالياً لمنطقة ${regionLabel}${summary ? ` (${summary})` : ''}. أخبرني في أي وقت إذا تغير موقعك أو جدولك أو عاداتك وسأكيف خطتك فوراً.`,
      rerunGreeting: (regionLabel: string) =>
        `بكل سرور، لنحدّث ملف نمط حياتك. هل ما زلت تتابع خطتك من ${regionLabel} أم من مكان آخر؟`,
      placeholderRegion: 'أجب بنعم، أو اكتب مدينتك ودولتك (مثال: دبي، الإمارات)...',
      placeholderAge: 'اكتب عمرك (مثال: 32) أو اختر تخطي...',
      placeholderAvailability: 'اختر الفترات أعلاه أو اكتب أوقاتك الخاصة (مثال: 7:30–9 صباحاً و7–9 مساءً)...',
      placeholderAgeTime: 'مثال: 34، متاح 7:30–9 صباحاً و7–9 مساءً (أو في أي وقت)...',
      placeholderRhythm: 'مثال: عمل مكتبي، صيام رمضان، حرارة الصيف...',
      placeholderCautions: 'مثال: تيبس خفيف في الركبة، غير مدخن (أو لا يوجد)...',
      placeholderComplete: 'أخبرني بأي تغيير في جدولك أو موقعك أو عاداتك...',
      quickSkipAge: 'تخطي · أفضل عدم التحديد',
      quickAnytime: 'مرن · في أي وقت',
      quickStandardRhythm: 'عمل منتظم · لا شيء مما سبق',
      quickNoCautions: 'لا توجد احتياطات · غير مدخن',
      quickDone: 'تم — العودة للخطة',
      quickExploreRoutines: 'استكشاف الروتينات',
      skipForNow: 'تخطي الآن',
      quickChangeSchedule: 'تعديل الجدول والأوقات',
      quickLowerIntensity: 'تخفيف الشدة والجهد',
      quickAddCaution: 'إضافة احتياط بدني',
      quickChangeRhythm: 'تعديل نمط العمل والإيقاع',
      quickAdjustFasting: 'تعديل ساعات الصيام',
      multiSelectContinue: (count: number) => `متابعة (${count} محدد)`,
      quickUpdateProfile: 'تحديث ملفي بالكامل',
      q1Title: '1. من أي مدينة أو دولة تتابع خطتك؟',
      q1Ask: (regionLabel: string) =>
        `رصدنا موقعك في ${regionLabel}. أكد المنطقة أو أدخل مدينتك ودولتك لنستخرج عوامل المناخ والحياة المناسبة لموقعك.`,
      q2Title: '2. العمر والفترات المتاحة يومياً',
      q2Ask:
        'كم عمرك، ومتى تكون متاحاً عادةً خلال اليوم؟ لكل دراسة سريرية قواعد توقيت خاصة بها — وتساعدنا فتراتك المتاحة في التحقق من الملاءمة قبل البدء.',
      q3Title: '3. الإيقاع اليومي، الثقافة، والبيئة المحلية',
      q3Ask: (regionLabel: string) =>
        `يتبع المقيمون في ${regionLabel} أنماطاً ثقافية ومعيشية متعددة. اختر ما يعبر عن يومك الفعلي:`,
      q4Title: '4. الاحتياطات البدنية والعادات اليومية',
      q4Ask:
        'هل لديك أي حساسية مفاصل أو عادات تدخين أحتاج لمراعاتها بأمان؟ يمكنك أيضاً كتابة أي تفاصيل إضافية أدناه.',
      autoFocusLabel: 'التركيز المشتق لـ N1 AI:'
    }
  },
  schedule: {
    eyebrow: 'ملاءمة الجدول الزمني',
    modeLabels: {
      profile_windows: 'فتراتي المتاحة',
      anytime: 'في أي وقت',
      custom_windows: 'تخصيص لهذه الخطة'
    },
    archetypeLabels: {
      flexible: 'مرن',
      spaced: 'جلسات متباعدة',
      anchored: 'مرتبط بتوقيت محدد',
      on_demand: 'عند الحاجة · في أي وقت',
      continuous: 'قاعدة يومية مستمرة'
    },
    statusBadges: {
      compatible: 'يناسب أوقاتك المتاحة',
      tight: 'وقت ضيق نسبياً',
      conflict: 'تعارض مع جدولك',
      flexible_anytime: 'مرن في أي وقت'
    },
    conflictProceedBtn: 'المتابعة بتوقيت مرن',
    onDemandCounterLabel: 'مسجّل اليوم',
    onDemandLogBtn: '+ تسجيل استخدام',
    onDemandOptionalHint: 'أداة اختيارية عند الحاجة — اضغط عليها عند الشعور بالرغبة فقط، ولا تمنع اكتمال اليوم بنسبة 100% عند عدم حدوثها.',
    continuousBadge: 'قاعدة طوال اليوم',
    continuousConfirmLabel: 'تم الالتزام اليوم',
    continuousPendingLabel: 'تأكيد نهاية اليوم',
    routineOverrideTitle: 'جدول هذه الخطة',
    customWindowHint: 'يُطبّق على هذه الخطة فقط — وتحتفظ خططك الأخرى بجداولها المستقلة.',
    lifestyleButton: 'نمط الحياة والموقع',
    modalTitle: 'ملف نمط الحياة التكيفي',
    modalSubtitle: 'خطة مخصصة لموقعك ومناخك وعاداتك اليومية ونوافذك الزمنية المتاحة.'
  },
  dayActions: {
    markComplete: 'تحديد اليوم كمكتمل',
    dayLogged: (day: number) => `تم تسجيل اليوم ${day}`,
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
      'تنويه طبي سريري: تقدم منصة TrialN1 استخراجاً تعليمياً للخطط الصحية مستنداً بدقة إلى الأدبيات السريرية المحكمة. ولا تقدم المنصة تشخيصاً طبياً أو وصفة علاجية، ولا تغني عن الإشراف الطبي المباشر من طبيب مرخص أو أخصائي علاج طبيعي.',
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
    defaultRoutineTitle: 'خطة بحثية',
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
    missingParameters: 'معايير مستنتجة'
  },
  assistant: {
    dialogLabel: 'المساعد الذكي N1 AI',
    close: 'إغلاق N1 AI',
    modeLabel: 'وضع المساعد',
    modes: {
      ask: 'استفسار',
      upload: 'إضافة بحث',
      lifestyle: 'نمط الحياة'
    },
    eyebrowUpload: 'بحث سريري جديد',
    titleAsk: 'اسأل N1',
    titleUpload: 'إضافة ورقة بحثية',
    stagingTitle: 'مراجعة مسودة الخطة المستخرجة',
    stagingEyebrow: 'الخطة المستخرجة',
    confirmAddPaper: 'تأكيد وبدء الخطة',
    discardCandidate: 'تجاهل',
    noActiveRoutineForAskTitle: 'لا توجد خطة نشطة محددة',
    noActiveRoutineForAskBody: 'قم برفع ورقة بحثية أو اختر خطة من الأبحاث الرائجة للبدء في توجيه الأسئلة.',
    switchToUpload: 'إضافة بحث',
    unifiedTitleNoRoutine: 'مستكشف الأبحاث والخطط السريرية',
    unifiedEyebrowNoRoutine: 'ذكاء TrialN1 السريري',
    unifiedEyebrowWithRoutine: 'موجه الخطة النشطة',
    unifiedWelcomeNoRoutine: 'ما هو الروتين الذي تود البدء به لأهدافك الصحية، حالتك، أو نمط حياتك؟',
    unifiedWelcomeNoRoutineBody:
      'استكشف روتينات الأبحاث البشرية الموثقة حسب الحالة الصحية، الهدف، أو نمط الحياة للبدء في روتين معتمد.',
    addAnotherWelcome: 'ما الهدف الصحي الآخر الذي تود العمل عليه؟',
    addAnotherBody:
      'صف هدفاً صحياً جديداً أو حالة أو نمط حياة — أو أرفق ملف PDF للبحث لبناء روتين معتمد آخر.',
    browseCommunityLink: 'أو تصفح الأبحاث الرائجة في المجتمع ←',
    universalPlaceholderNoRoutine: 'صف حالتك أو نمط حياتك (مثل الورديات، تأهيل الركبة)، أو الصق رابط البحث، أو ارفع PDF...',
    universalPlaceholderWithRoutine: 'اسأل عن هذه الخطة، أو أبلغ عن ألم، أو عدّل التوقيت...',
    discoveryTabs: {
      healthGoals: 'الأهداف الصحية والحالات',
      lifestyle: 'نمط الحياة والعادات'
    },
    lifestyleDiscoveryTitle: 'التخصيص حسب نمط الحياة',
    lifestyleDiscoveryBody:
      'أجب عن بضعة أسئلة سريعة حول نمط حياتك أو اختر نمطك اليومي لنقترح روتينات سريرية مخصصة لجدولك وبيئتك.',
    answerLifestyleQuestionsBtn: 'الإجابة عن 3 أسئلة سريعة حول نمط الحياة',
    orPickLifestylePreset: 'أو اختر نمط حياة لمطابقة الروتينات:',
    attachPdfChip: 'إسقاط أو إرفاق ملف PDF للبحث (أو استخدم 📎 بالأسفل)',
    attachPdfHint: 'يمكنك أيضاً إرفاق ملف PDF في أي وقت عبر أيقونة المشبك 📎 بالأسفل.',
    backToDiscovery: 'العودة إلى استكشاف الروتينات',
    backToRoutine: 'العودة إلى الخطة النشطة',
    lifestyleMatchedTitle: 'مقترح بناءً على نمط حياتك',
    lifestyleMatchedSubtitle:
      'بناءً على ملف نمط حياتك المحفوظ — ابدأ بخطة معتمدة أو استكشف حالة صحية أخرى بالأسفل.',
    orExploreGoals: 'أو استكشف حسب الهدف الصحي أو الحالة:',
    lifestyleMatchReasons: {
      summer_heat: 'يطابق: حرارة الصيف',
      ramadan_fasting: 'يطابق: صيام رمضان',
      intermittent_fasting: 'يطابق: الصيام المتقطع',
      smoking: 'يطابق: الحد من التدخين',
      shift_work: 'يطابق: الورديات والنوم',
      desk_sedentary: 'يطابق: العمل المكتبي',
      circadian: 'يطابق: الإيقاع اليومي',
      physical_caution: 'يطابق: حماية المفاصل',
      popular: 'خطة سريرية معتمدة'
    },
    lifestyleChips: [
      'حرارة الصيف الشديدة والترطيب',
      'الصيام المتقطع وصيام رمضان',
      'العمل بنظام الورديات والجدول الليلي',
      'العمل المكتبي والتركيز الخامل',
      'الحد من أضرار النيكوتين والمدواخ',
      'إعادة التأهيل اللطيف على المفاصل'
    ],
    problemChips: [
      'تأهيل أوتار الركبة والعرقوب',
      'علاج تأخر النوم والإرهاق',
      'الصيام المتقيد بالوقت',
      'علاج تساقط الشعر (الثعلبة)',
      'الكرياتين والإرهاق الإدراكي',
      'العلاج بالضوء الساطع'
    ],
    lifestyleBridgePrompt: (caution: string) =>
      `بناءً على التنبيه الصحي الخاص بـ (${caution})، هل ترغب في استعراض خطط إعادة التأهيل السريرية؟`,
    lifestyleBridgeAction: 'استعراض الخطط السريرية',
    researchNavigatorSource: 'المصدر · أبحاث سريرية بشرية محكمة',
    typing: 'N1 AI يكتب الآن...',
    attach: 'إرفاق ملف PDF',
    send: 'إرسال',
    inputAsk: 'اسأل N1 عن هذه الخطة السريرية',
    inputUpload: 'أدخل رابط DOI أو PubMed أو ارفع الملف',
    placeholderAsk: 'اسأل عن الجرعات، التوقيت، الأمان، أو قواعد التقدم...',
    placeholderUpload: 'الصق رابط البحث أو ارفع ملف PDF...',
    emptyTitle: 'لا توجد رسائل سابقة',
    emptyBody: 'اسأل عن الجرعات، وتيرة التمرين، معايير الأمان، أو قواعد التصعيد.',
    linkGuidance: {
      discoveryMatchesTitle: 'روتينات مطابقة',
      openAccessTrialsTitle: 'تجارب سريرية مفتوحة الوصول',
      discoveryMatchesFooter: 'أو أرفق ملف PDF للبحث (📎) أو الصق معرّف DOI بالأسفل.',
      title: 'لم يتم العثور على معرّف بحثي في هذا الرابط',
      subtitle: 'معظم مقالات المدونات وروابط المواقع العامة لا تتضمن معرّف DOI المباشر للأبحاث المفتوحة.',
      askPrompt: 'ما هو الهدف الصحي أو التدخل السريري الذي تبحث عنه؟',
      communityTitle: 'الخطط المجتمعية المتاحة (معايرة وجاهزة)',
      communitySubtitle: 'ابدأ بخطة سريرية معتمدة على مشاركين بشريين الآن:',
      loadRoutine: 'تحميل الخطة',
      previewRoutine: 'معاينة',
      browseCommunity: 'تصفح كل أبحاث المجتمع',
      externalTitle: 'البحث في قواعد البيانات البحثية المفتوحة',
      externalSubtitle: 'ابحث عن تجارب سريرية بشرية محكمة بمعرّف DOI:',
      pubmedSearch: 'بحث في PubMed (NIH)',
      europePmcSearch: 'بحث في Europe PMC',
      googleScholarSearch: 'بحث في Google Scholar',
      suggestions: [
        'إعادة تأهيل وتر العرقوب',
        'علاج تساقط الشعر (الثعلبة)',
        'الكرياتين والإرهاق الإدراكي',
        'الصيام المتقيد بالوقت',
        'العلاج بالضوء الساطع',
        'الإقلاع عن المدواخ والنيكوتين'
      ],
      customSearchPlaceholder: 'اكتب اسم الحالة أو الموضوع (مثل تأهيل الركبة، كرياتين، صيام)...',
      searchAction: 'بحث في الأبحاث',
      extractRoutine: 'استخراج بواسطة N1 AI',
      clearSearch: 'مسح البحث'
    },
    medicalDisclaimerChip: 'التنويه السريري',
    medicalDisclaimerTitle: 'التنويه والإرشاد الطبي السريري',
    medicalDisclaimerGotIt: 'فهمت ذلك',
    closeDisclaimer: 'إغلاق التنويه',
    engines: {
      onDeviceGemma: 'نموذج Gemma الداخلي (على الجهاز)',
      cloudGemini: 'ذكاء سحابي',
      serverGemma: 'خادم Gemma 2',
      localRules: 'المطابق السريري المحلي',
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
    eyebrow: 'إرشادات الاستخدام',
    tabs: {
      guide: 'كيف يعمل',
      science: 'علوم العادات (BCT)',
      scope: 'الأوراق المقبولة'
    },
    scienceEyebrow: 'محرك الطب السلوكي · BCT Taxonomy v1',
    scienceTitle: 'لماذا تستمر العادات في TrialN1 دون انقطاع؟',
    scienceIntro:
      'تعتمد معظم تطبيقات اللياقة على جداول صارمة وتصفير العدادات عند الغياب، مما يسبب الإحباط والانقطاع. في TrialN1، ترتبط كل خطوة بتقنيات تغيير السلوك المعتمدة دولياً (Michie et al. 2013) لحماية زخمك الصحي في أصعب الظروف.',
    sciencePillars: [
      {
        code: 'BCT 8.7 · المهام المتدرجة',
        title: 'الخطوات الميسّرة التكيفية',
        body: 'عند ضيق الوقت أو التعب أو حرارة 48°، تتقلص الخطة تلقائياً إلى خطوة ميسّرة لمدة دقيقتين داخل التكييف لحفظ مسار العادة العصبي.',
        benefit: 'بدون مقاومة بداية'
      },
      {
        code: 'BCT 11.2 · ضبط المشاعر السلبية',
        title: 'استعادة نشاط دون عقاب',
        body: 'لا يُصفّر عدادك أبداً بعد أي انقطاع؛ يُعامل الغياب كبيانات للتكيف وليس كفشل شخصي، مما يقضي على الإحباط والشعور بالذنب.',
        benefit: 'دون خجل أو انقطاع'
      },
      {
        code: 'BCT 1.2 & 8.1 · حل العوائق والإحلال',
        title: 'الإحلال العملي للعوائق',
        body: 'استبدال التمارين الخارجية بممرات مكيفة عند اشتداد القيظ، ومواءمة النشاط مع الصيام والسحور، وتوفير بدائل حسية للمدواخ والتدخين.',
        benefit: 'مرونة مع الواقع'
      }
    ],
    inspectLedgerTitle: 'الشفافية السريرية وسجل الاعتماد',
    inspectLedgerSubtitle:
      'استعرض جميع تقنيات تغيير السلوك المعتمدة، وآليات عملها، وعوائق البيئة الخليجية التي تعالجها.',
    inspectLedgerButton: 'استعراض تصنيف BCT السلوكي'
  },
  onboarding: {
    welcomeEyebrow: 'البداية السريعة',
    welcomeTitle: 'حوّل الأبحاث السريرية إلى خطط صحية يومية قابلة للتطبيق',
    welcomeSubtitle:
      'تقوم منصة TrialN1 بقراءة الأوراق السريرية المحكمة وتحويلها إلى برامج صحية قابلة للتنفيذ والتكيف. ابدأ بملف البحث الخاص بك أو استكشف الأبحاث السريرية الرائجة في قاعدتنا.',
    ctaUpload: 'رفع ورقة بحثية',
    ctaHowTo: 'دليل الاستخدام والأبحاث الرائجة',
    dropPrompt: 'اسحب ملف PDF البحثي هنا للاستخراج الفوري',
    dropSubtext: 'تجارب سريرية، إعادة تأهيل، تغذية، نوم، وعلوم دوائية بشرية'
  },
  landing: {
    uaeBannerBadge: 'أبوظبي 2026',
    uaeBannerText: 'تحدي صحة المستقبل: استدامة السلوكيات الصحية في الإمارات',
    ctaGuest: 'جرّب كزائر',
    ctaLogin: 'تسجيل الدخول',
    ctaSignup: 'إنشاء حساب',
    ctaGoToApp: 'الانتقال إلى خطتك',
    loggedInBadge: (name: string) => `تم تسجيل الدخول باسم ${name}`,
    nav: {
      howItWorks: 'كيف يعمل',
      domains: 'المجالات الصحية',
      gatekeeper: 'الموثوقية السريرية',
      features: 'المزايا'
    },
    steps: {
      step1Number: '01',
      step1Title: 'المعالجة المباشرة للوثائق',
      step1Body: 'ارفع أي ورقة بحثية سريرية. يقرأ Gemini محتوى الملف مباشرة دون استخراج نصوص هش.',
      step2Number: '02',
      step2Title: 'التدقيق السريري الصارم',
      step2Body: 'يتحقق من ملاءمة التجارب للبشر ويدقق فترات الثبات أو الجرعات بناءً على المعايير السريرية.',
      step3Number: '03',
      step3Title: 'الخطة اليومية والتوجيه الصوتي',
      step3Body: 'ينفذ المجموعات اليومية وقواعد التدرج وحدود الأمان، ويجيب مستنداً إلى قسم المنهجية فقط.',
      step4Number: '04',
      step4Title: 'علوم السلوك والخطوات الميسّرة (BCT v1)',
      step4Body: 'مبني على تقنيات تغيير السلوك المعتمدة: خطوات ميسّرة عند الإجهاد، وبدائل التكييف، واستعادة نشاط دون عقاب أو ذنب.',
      step5Number: '05',
      step5Title: 'التقرير السريري للالتزام',
      step5Body: 'ملخص موجز لاتجاهات الالتزام ومؤشرات التحسن وسجلات الأعراض مهيأ لمراجعة الطبيب.'
    },
    footerSignIn: 'تسجيل الدخول',
    footerCreateAccount: 'إنشاء حساب',
    footerGithub: 'GitHub',
    uaeEditionLink: 'إصدار أبوظبي والإمارات · التحدي 09'
  },
  uaeLanding: {
    meta: {
      title: 'TrialN1 الإمارات // استدامة السلوكيات الصحية في أبوظبي',
      description:
        'تحدي الابتكار الصحي الرقمي للمستقبل: منصة سلوكية تكيفية مصممة لبيئة أبوظبي ودولة الإمارات، تعالج انكسار العادات عبر الخطوات الميسّرة والتكيف مع المناخ الحار وتنظيم أوقات شهر رمضان.'
    },
    challengeBadge: 'تحدي الابتكار الصحي الرقمي للمستقبل · أبوظبي 2026',
    challengeSubbadge: 'محور الرفاهية والصحة · التحدي 09: استدامة السلوكيات الصحية',
    heroTitle: 'استدامة السلوكيات الصحية في أبوظبي والإمارات — بمرونة علمية ودون انقطاع عقابي.',
    heroSubtitle:
      'حرارة الصيف المرتفعة ونوبات العمل المتغيرة والتحديات اليومية قد تعيق تطبيقات اللياقة التقليدية الصارمة. N1 AI يتكيف مع واقعك بخطوات ميسّرة وبمسار استعادة نشاط مرن يحفظ استمرارية عاداتك ولا يعيدك إلى نقطة الصفر.',
    ctaStartTrial: 'ابدأ خطتك الإماراتية — مجاناً',
    ctaExploreRoutines: 'استكشف التكيفات الإماراتية',
    backToGlobal: 'الإصدار العالمي',
    heroTrustPoints: [
      'دون انقطاع عقابي · متكيف مع حرارة 48° وشهر رمضان',
      'مبني فقط على تجارب تدخلية بشرية',
      'دعم كامل للغة العربية واتجاه RTL'
    ],
    interactivePreview: {
      tag: 'معاينة الإمارات',
      title: 'خطة اليوم المتكيفة',
      progressLabel: 'إنجاز اليوم',
      step1Action: 'ثبات حركي داخلي في التكييف',
      step1Detail: 'بديل الحر الشديد ACSM · عند ارتفاع الحرارة إلى 48°',
      step1Meta: 'خطوة ميسّرة 4 د',
      step2Action: 'تنظيم السوائل والنشاط بعد الإفطار',
      step2Detail: 'تزامن الغدد الصماء الخليجية · الإيقاع الحيوي',
      step2Meta: 'جلسة 5 دقائق',
      tryHint: 'انقر على أي خطوة لإتمامها.',
      allDone: 'تم حفظ سلسلة التزامك بنجاح.'
    },
    domainsTitle: 'مصمم للحياة اليومية في دولة الإمارات',
    domainsSubtitle:
      'ما طورناه خصيصاً ليلائم مناخ أبوظبي، ونوبات العمل، والإيقاع الثقافي في الإمارات.',
    domains: [
      {
        id: 'heat',
        tag: 'التكيف المناخي',
        title: 'التكيف الحراري حتى 48° مئوية',
        description:
          'يستبدل التمارين الخارجية تلقائياً بخطوات ميسّرة داخل الأماكن المكيّفة خلال ذروة حرارة الصيف.',
        tone: 'orange' as const,
        stat: 'بدائل داخلية ذكية',
        image: '/images/image2.png',
        imageAlt: 'مشارك يؤدي تمرين حركة وإعادة تأهيل داخلي'
      },
      {
        id: 'ramadan',
        tag: 'التزامن الحيوي',
        title: 'مزامنة الإيقاع في شهر رمضان',
        description:
          'تنظيم الترطيب والتغذية والتعرض للضوء حول فترتي السحور والإفطار لدعم التوازن الأيضي.',
        tone: 'yellow' as const,
        stat: 'توقيت السحور والإفطار'
      },
      {
        id: 'midwakh',
        tag: 'الحد من الأضرار',
        title: 'الإقلاع عن المدواخ والدخة والشيشة',
        description:
          'برامج إحلال سلوكي وركوب موجة الرغبة وتدرج أسبوعي مصمم لعادات التدخين الإقليمية.',
        tone: 'sky' as const,
        stat: 'برنامج تدرج 42 يوماً'
      },
      {
        id: 'shifts',
        tag: 'تعافي المناوبات',
        title: 'مرونة مناوبات 14 ساعة',
        description:
          'حماية الاستمرارية الصحية للعاملين في القطاع الصحي والطاقة بنظام المناوبات المتغيرة.',
        tone: 'lavender' as const,
        stat: 'جلسات تهدئة واستشفاء'
      },
      {
        id: 'reentry',
        tag: 'دون لوم أو تصفير',
        title: 'استعادة نشاط غير عقابية',
        description:
          'الانقطاع لعدة أيام يفعّل خطوة ميسّرة مدتها 3 دقائق بدلاً من تصفير عداد إنجازك.',
        tone: 'peach' as const,
        stat: 'حماية سلسلة الالتزام'
      },
      {
        id: 'arabic',
        tag: 'تجربة ثنائية اللغة',
        title: 'دعم العربية RTL والوسوم المحلية',
        description:
          'واجهة عربية أصيلة من اليمين إلى اليسار مع وسوم نمط حياة مخصصة للمقيمين في أبوظبي والإمارات.',
        tone: 'mint' as const,
        stat: 'EN | العربية جاهز'
      }
    ],
    architectureTitle: 'كيف يعمل إصدار الإمارات',
    steps: {
      step1Number: '01',
      step1Title: 'تجارب سريرية مضبوطة لبيئة الإمارات',
      step1Body:
        'يضم خططاً جاهزة للتكيف الحراري، والاستقرار الأيضي في رمضان، والتدرج عن المدواخ والدخة إلى جانب أي ملف PDF ترفعه.',
      step2Number: '02',
      step2Title: 'فهم السياق والتحديات الإقليمية',
      step2Body:
        'يأخذ في الحسبان حرارة الصيف التي تتجاوز 45° مئوية، ومناوبات 12–14 ساعة، وأوقات الصيام قبل اقتراح المهام اليومية.',
      step3Number: '03',
      step3Title: 'الخطوات الميسّرة في 3 دقائق',
      step3Body:
        'يتقلص تلقائياً إلى خطوة ميسّرة داخل التكييف عند انشغال يومك لحفظ الحلقة العصبية للعادة.',
      step4Number: '04',
      step4Title: 'تقرير طبي جاهز لمراكز صحة وكليفلاند كلينك',
      step4Body:
        'يصدّر ملخص التزام ومؤشرات حيوية من صفحة واحدة مهيأ للاستشارات الطبية في SEHA وCCAD وSSMC.'
    },
    scopeBadge: 'مستند إلى الأدلة السريرية الخليجية والعالمية',
    rigorTitle: 'مصمم وفق المعايير السريرية في أبوظبي',
    rigorSubtitle:
      'كل تكيف إماراتي مرتبط بإرشادات سريرية بشرية محكمة — بعيداً عن عدادات اللياقة العشوائية.',
    scopeNote:
      'تستند خطط الإمارات لدينا إلى إرشادات السلامة الحرارية ACSM، وتوصيات جمعية الغدد الصماء الخليجية لرمضان، وإرشادات كوكرين للإقلاع عن التبغ، ومتوافقة مع معايير مركز أبوظبي للصحة العامة.',
    capabilitiesTitle: 'ما بنيناه خصيصاً لدولة الإمارات',
    features: {
      gatekeeperTitle: 'محرك الخطوات الميسّرة للحر',
      gatekeeperBody:
        'يستبدل المجهود الخارجي بتمارين ثبات حركي داخلية لمدة 3–4 دقائق عند اشتداد درجات الحرارة.',
      auditingTitle: 'تزامن رمضان والمناوبات',
      auditingBody:
        'يضبط نوافذ الترطيب والتعرض للضوء والنشاط بسلاسة حول السحور والإفطار وجداول العمل المتغيرة.',
      safetyTitle: 'تقليل أضرار المدواخ والشيشة',
      safetyBody:
        'يطبق تقنيات ركوب موجة الرغبة والإحلال الحسي لخفض وتيرة تدخين الدخة والشيشة تدريجياً.',
      summaryTitle: 'ملخص طبيب صحة وكليفلاند كلينك',
      summaryBody:
        'ينشئ ملخص التزام من صفحة واحدة مع سجل التحول للخطوات الميسّرة والمؤشرات الحيوية بالعربية والإنجليزية.'
    },
    footerTagline: 'TrialN1 · إصدار أبوظبي والإمارات',
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
        'شاهد الفرق بين صرامة التطبيقات التقليدية التي تؤدي إلى التوقف المفاجئ، وبين مرونة N1 AI التي تحافظ على التزامك الصحي.',
      barrierLabel: 'اختر أحد التحديات اليومية في أبوظبي:',
      barrierHeat: 'حرارة الصيف الظهيرة 48° مئوية',
      barrierShift: 'نوبة عمل إضافية 14 ساعة في المستشفى أو قطاع الطاقة',
      barrierRamadan: 'صيام شهر رمضان وساعات الصلاة المتأخرة',
      traditionalAppTitle: 'التطبيق التقليدي الصارم',
      traditionalResultTitle: 'انقطاع السلسلة: اليوم 0',
      traditionalResultBody:
        'تعذّر أداء 45 دقيقة كاملة. انقطعت السلسلة وعاد العداد إلى الصفر، مما يصيب 82% من المستخدمين بالإحباط وترك العادة نهائياً.',
      traditionalBadge: 'عقاب ثنائي صارم',
      viskotuAppTitle: 'محرك TrialN1 التكيفي',
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
      body: 'تجاوز درجات الحرارة 45° مئوية صيفاً يجعل الرياضة الخارجية محفوفة بالمخاطر. يستبدل N1 AI الخطوات الخارجية بتمارين حركية داخلية مكيّفة بسلاسة تامة.'
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
    routinesTitle: 'خطط صحية مخصصة لأبوظبي',
    routinesSubtitle:
      'خطط صحية محكمة ومضبوطة مسبقاً، جاهزة للتطبيق والتتبع الفوري في المتصفح.',
    routineCards: {
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
    launchRoutineCta: 'بدء الخطة في التطبيق',
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
  },
  shareModal: {
    title: 'مشاركة الخطة العلاجية',
    eyebrow: 'رابط مباشر للأطباء والمشاركين',
    description: 'امسح رمز الاستجابة السريعة (QR) للفتح المباشر على الهاتف، أو شارك الرابط عبر القنوات السريرية والشخصية.',
    copyLink: 'نسخ الرابط',
    copiedToast: 'تم نسخ رابط الخطة إلى الحافظة',
    nativeShare: 'مشاركة عبر الجهاز…',
    socialWhatsApp: 'واتساب',
    socialX: 'منصة إكس (تويتر)',
    socialLinkedIn: 'لينكد إن',
    socialEmail: 'البريد الإلكتروني',
    calendarSectionTitle: 'تنبيهات التقويم',
    calendarSectionDesc: 'مزامنة جدول الخطة اليومية مع تنبيهات تقويم Apple أو Google أو Outlook.',
    googleCalendar: 'تقويم Google',
    downloadIcs: 'تقويم Apple / Outlook (.ics)',
    downloadedIcsToast: 'تم تنزيل ملف التقويم (.ics)',
    deepLinkToast: (title: string) => `تم تحميل الخطة المشتركة: ${title}`,
    openShareButton: 'مشاركة',
    addToCalendarButton: 'التقويم',
    scanQrLabel: 'امسح بكاميرا الهاتف لتحميل الخطة',
    closeButton: 'إغلاق'
  }
};
