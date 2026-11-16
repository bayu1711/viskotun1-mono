/**
 * ViskotuN1 — Gulf Clinical & Behavioral Change Glossary
 * Aligned with UAE Department of Health (DoH Abu Dhabi), SEHA, and MoHAP clinical communication standards.
 * Used for culturally attuned, non-punitive, and accessible Arabic localization.
 */

export interface GlossaryTerm {
  en: string;
  ar: string;
  transliteration?: string;
  clinicalDomain: 'behavior' | 'clinical' | 'regional' | 'safety' | 'ux';
  rationale: string;
}

export const GULF_HEALTH_GLOSSARY: GlossaryTerm[] = [
  {
    en: 'Daily Routine / Health Plan',
    ar: 'الخطة اليومية / البرنامج الصحي',
    clinicalDomain: 'behavior',
    rationale:
      'Avoids the Arabic word "روتين" (roteen) which carries connotations of tedious bureaucracy or mundane chores.'
  },
  {
    en: 'Streak / Adherence Streak',
    ar: 'سلسلة الالتزام / أيام الإنجاز',
    clinicalDomain: 'behavior',
    rationale:
      'Translates behavioral continuity positively as commitment or achievement rather than a mechanical "line" or "chain".'
  },
  {
    en: 'Adaptive Micro-Dose',
    ar: 'الخطوة الميسّرة / جرعة التكيف',
    clinicalDomain: 'behavior',
    rationale:
      'Expresses a low-friction, guilt-free session designed to preserve the behavioral habit loop without fatigue.'
  },
  {
    en: 'Dose Mode',
    ar: 'نمط الإنجاز',
    clinicalDomain: 'behavior',
    rationale:
      'Presents standard vs. micro-dose options as personal modes of achievement rather than pharmaceutical dosing.'
  },
  {
    en: 'Lapse / Missed Days',
    ar: 'أيام التوقف المؤقت',
    clinicalDomain: 'behavior',
    rationale:
      'Strict non-punitive phrasing avoiding "انتكاسة" (relapse) or "فشل" (failure), eliminating the abstinence violation effect.'
  },
  {
    en: 'Re-Entry / Smooth Recovery',
    ar: 'استعادة النشاط بسلاسة',
    clinicalDomain: 'behavior',
    rationale:
      'Reinforces that participants resume where they left off without blame or progress reset.'
  },
  {
    en: 'Midwakh / Dokha Tobacco',
    ar: 'المدواخ والدخّة',
    clinicalDomain: 'regional',
    rationale:
      'Standard Emirati Arabic term for the traditional pipe (Midwakh) and finely ground tobacco (Dokha) widely observed across UAE.'
  },
  {
    en: 'Shisha / Waterpipe',
    ar: 'الشيشة / المعسّل',
    clinicalDomain: 'regional',
    rationale:
      'Universal Gulf term for waterpipe tobacco use, crucial for accurate cardiopulmonary baseline tracking.'
  },
  {
    en: 'Ramadan Fasting Observer',
    ar: 'صيام شهر رمضان المبارك',
    clinicalDomain: 'regional',
    rationale:
      'Culturally reverent phrasing for daylight fasting; shifts hydration/nutrition recommendations to post-Iftar hours.'
  },
  {
    en: 'Healthcare Shift Work',
    ar: 'نوبات العمل والورديات الصحية',
    clinicalDomain: 'regional',
    rationale:
      'Standard term for rotating and overnight hospital/emergency personnel schedules in the UAE.'
  },
  {
    en: 'Gulf Summer Heat Adaptation',
    ar: 'التكيف مع حرارة الصيف في الخليج',
    clinicalDomain: 'regional',
    rationale:
      'Directly addresses extreme climate barriers in Abu Dhabi, recommending climate-controlled indoor spaces.'
  },
  {
    en: 'Biofeedback / Symptom Telemetry',
    ar: 'المؤشرات الذاتية / التقييم الحيوي',
    clinicalDomain: 'clinical',
    rationale:
      'Clear, accessible patient-facing phrasing for logging discomfort or biomarker scores.'
  },
  {
    en: 'Clinical Safety Guardrail',
    ar: 'ضوابط الأمان السريرية',
    clinicalDomain: 'safety',
    rationale:
      'Translates the software guardrail concept accurately into medical safety stop-rules and load reduction rules.'
  },
  {
    en: 'Real-World Efficacy',
    ar: 'الفعالية في التطبيق الواقعي',
    clinicalDomain: 'clinical',
    rationale:
      'Distinguishes between lab-controlled trials (N=sample) and community real-world compliance outcomes.'
  }
];
