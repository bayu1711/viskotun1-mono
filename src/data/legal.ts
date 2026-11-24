import { ROUTES } from './navigation';

export type LegalSlug =
  | 'privacy'
  | 'terms'
  | 'terms-of-use'
  | 'disclaimer'
  | 'cookies'
  | 'ai-transparency';

export type LegalTone = 'mint' | 'cream' | 'blush' | 'sky' | 'lavender' | 'yellow';

export interface LegalSection {
  readonly id: string;
  readonly heading: string;
  readonly paragraphs: readonly string[];
  readonly bullets?: readonly string[];
}

export interface LegalDocument {
  readonly slug: LegalSlug;
  readonly href: string;
  readonly title: string;
  readonly shortTitle: string;
  readonly subtitle: string;
  readonly category: string;
  readonly lastUpdated: string;
  readonly tone: LegalTone;
  readonly summaryTitle: string;
  readonly summaryPoints: readonly string[];
  readonly sections: readonly LegalSection[];
}

export const LEGAL_EFFECTIVE_DATE = 'November 24, 2026';
export const LEGAL_CONTACT_EMAIL = 'legal@trialn1.app';
export const PRIVACY_CONTACT_EMAIL = 'privacy@trialn1.app';

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    slug: 'privacy',
    href: ROUTES.privacy,
    title: 'Privacy Policy',
    shortTitle: 'Privacy Policy',
    subtitle:
      'How TrialN1 collects, processes, stores, and protects your personal information, uploaded research papers, and daily routine logs.',
    category: 'Data & Privacy',
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    tone: 'mint',
    summaryTitle: 'Privacy at a glance',
    summaryPoints: [
      'Guest mode stores your routines and daily check-ins locally in your browser—no cloud account is required to explore.',
      'Signed-in accounts sync your routines, adherence trends, and preferences securely via Google Cloud / Firebase.',
      'Uploaded clinical PDFs are processed server-side by Gemini on Google Cloud Vertex AI solely to extract your structured routine and answer citation-grounded questions.',
      'We never sell your personal data, health logs, or uploaded documents to third-party advertisers or data brokers.'
    ],
    sections: [
      {
        id: 'overview',
        heading: '1. Scope & Data Controller',
        paragraphs: [
          'This Privacy Policy describes how TrialN1 ("TrialN1", "we", "us", or "our") handles personal information when you access our web application, landing pages, AI research extraction features, voice coaching tools, and community features (collectively, the "Service").',
          'By creating an account, continuing as a guest, or using any part of the Service, you acknowledge the data practices described in this Privacy Policy.'
        ]
      },
      {
        id: 'information-collected',
        heading: '2. Information We Collect',
        paragraphs: [
          'Depending on how you use TrialN1, we collect only the information needed to deliver and improve your experience:'
        ],
        bullets: [
          'Account Information: Name, email address, authentication identifiers, and profile photo/initials provided when you sign up with email/password or Google OAuth.',
          'Research Documents: Peer-reviewed clinical research PDFs or study excerpts you upload for routine extraction and N1 AI Q&A.',
          'Routine & Biofeedback Logs: Daily task completions, micro-dose adjustments, pain or exertion scores, lifestyle tuning settings, optional biomarker entries, and optional milestone progress photos.',
          'Device & Technical Data: Browser type, language preference (e.g., English or Arabic), basic error diagnostics, and essential authentication session tokens.'
        ]
      },
      {
        id: 'guest-vs-account',
        heading: '3. Guest Mode vs. Signed-In Cloud Sync',
        paragraphs: [
          'TrialN1 supports an instant Guest Mode that saves your routines and daily logs locally in your browser storage (localStorage). Guest data remains on your device unless you choose to sign in or submit a document for server-side AI extraction.',
          'When you create an account or sign in with Google, your routines, adherence history, and preferences are synced to Google Cloud / Firebase so you can access them across devices.'
        ]
      },
      {
        id: 'ai-processing',
        heading: '4. AI Document & Voice Processing',
        paragraphs: [
          'When you upload a research PDF or ask the N1 AI Safety Companion a question, your request is transmitted over encrypted HTTPS connections to our server-side route handlers and processed using Gemini on Google Cloud Vertex AI.',
          'We do not use your private health logs, biofeedback entries, or personal account data to train public third-party foundation models. For full details on automated extraction, please review our AI & Data Transparency Notice.'
        ]
      },
      {
        id: 'how-we-use',
        heading: '5. How We Use Information',
        paragraphs: ['We use collected information strictly to:'],
        bullets: [
          'Convert eligible human interventional research papers into structured, adaptive daily routines.',
          'Provide citation-grounded answers, missing-parameter audits, and optional voice coaching.',
          'Generate personal adherence analytics and 1-page clinical summaries you choose to export.',
          'Maintain platform security, enforce our Scientific Gatekeeper scope, prevent abuse, and troubleshoot technical issues.'
        ]
      },
      {
        id: 'sharing-and-processors',
        heading: '6. Service Providers & Data Sharing',
        paragraphs: [
          'We do not sell or rent your personal information. We share data only with essential infrastructure sub-processors strictly under confidentiality and data-protection obligations:'
        ],
        bullets: [
          'Google Cloud Platform & Vertex AI (cloud hosting, serverless compute, and Gemini AI processing).',
          'Firebase Authentication & Cloud Firestore (user identity management and encrypted cloud sync).',
          'Legal compliance: We may disclose information only when required by applicable law, court order, or to protect the safety and rights of users and the public.'
        ]
      },
      {
        id: 'retention-and-security',
        heading: '7. Data Retention & Security',
        paragraphs: [
          'We retain your account and routine data for as long as your account remains active or as needed to provide the Service. Guest data stored in your browser persists until you clear your browser storage or reset your session.',
          'We employ industry-standard technical safeguards, including TLS encryption in transit, server-side secret isolation (no cloud credentials exposed to client bundles), and strict access controls. No method of electronic transmission or storage is 100% infallible, so please protect your account credentials.'
        ]
      },
      {
        id: 'your-rights',
        heading: '8. Your Privacy Rights (GDPR, UAE PDPL, CCPA)',
        paragraphs: [
          'Depending on your jurisdiction—including the European Economic Area (GDPR), the United Arab Emirates (Federal Decree-Law No. 45 of 2021 on Personal Data Protection — UAE PDPL), and California (CCPA/CPRA)—you may have the right to:'
        ],
        bullets: [
          'Access and receive a portable copy of the personal data we hold about you.',
          'Correct inaccurate or incomplete profile and routine information.',
          'Request deletion of your account and associated cloud-synced records.',
          'Withdraw consent or object to specific processing activities where applicable.'
        ]
      },
      {
        id: 'children',
        heading: '9. Children’s Privacy',
        paragraphs: [
          'TrialN1 is intended for adults aged 18 and older (or the age of digital consent in your jurisdiction). We do not knowingly collect personal information from children under 16. If you believe a child has provided personal data to us, contact us immediately so we can delete it.'
        ]
      },
      {
        id: 'contact',
        heading: '10. Contact & Policy Updates',
        paragraphs: [
          `We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. Material updates will be indicated by updating the effective date at the top of this page.`,
          `For privacy inquiries, data export requests, or deletion requests, please email us at ${PRIVACY_CONTACT_EMAIL}.`
        ]
      }
    ]
  },
  {
    slug: 'terms',
    href: ROUTES.terms,
    title: 'Terms & Conditions',
    shortTitle: 'Terms & Conditions',
    subtitle:
      'The binding legal agreement governing your account, access, intellectual property, and use of TrialN1.',
    category: 'Core Agreement',
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    tone: 'cream',
    summaryTitle: 'Key terms at a glance',
    summaryPoints: [
      'You must be at least 18 years old (or have legal guardian consent where permitted) to create a TrialN1 account.',
      'TrialN1 is an educational and behavioral-support tool—not a medical device, clinic, or licensed healthcare provider.',
      'You retain ownership of the personal logs and notes you create, while ensuring you have the right to upload any research PDF.',
      'We provide the Service "as is" and limit liability to the maximum extent permitted by applicable law.'
    ],
    sections: [
      {
        id: 'acceptance',
        heading: '1. Acceptance of Terms',
        paragraphs: [
          'These Terms & Conditions ("Terms") form a legally binding agreement between you and TrialN1 governing your access to and use of the TrialN1 web application, APIs, and related services ("Service").',
          'By creating an account, clicking "I agree", continuing with Google, or using Guest Mode, you agree to be bound by these Terms, our Terms of Use, our Privacy Policy, and our Medical & Research Disclaimer. If you do not agree, do not use the Service.'
        ]
      },
      {
        id: 'eligibility-accounts',
        heading: '2. Eligibility & Account Responsibilities',
        paragraphs: [
          'You represent that you are at least 18 years old and have the legal capacity to enter into these Terms. When you register an account, you agree to provide accurate information and keep your login credentials confidential.',
          'You are responsible for all activity occurring under your account. Notify us promptly if you suspect unauthorized access.'
        ]
      },
      {
        id: 'service-scope',
        heading: '3. Nature of the Service & No Medical Advice',
        paragraphs: [
          'TrialN1 translates peer-reviewed human interventional research into structured daily habit plans, tracks self-reported adherence and biofeedback, and provides AI-assisted Q&A grounded in the source study Methods.',
          'TrialN1 does NOT provide medical advice, diagnosis, treatment, or prescriptions. All routines, conservative clinical defaults, and AI responses are strictly informational. Always consult a qualified physician or licensed healthcare professional before starting, modifying, or stopping any health, rehabilitation, fasting, exercise, or supplement routine.'
        ]
      },
      {
        id: 'user-content-ip',
        heading: '4. User Content & Uploaded Research Papers',
        paragraphs: [
          'You retain ownership of your personal logs, notes, and biofeedback entries. By uploading a research PDF or submitting text to the Service, you grant TrialN1 a limited, non-exclusive, revocable license to process that content solely to operate and deliver the Service to you.',
          'You represent and warrant that you have the necessary legal rights or permissions to upload any PDF or document you submit, and that your uploads do not infringe third-party copyrights, privacy rights, or confidentiality obligations.'
        ]
      },
      {
        id: 'intellectual-property',
        heading: '5. TrialN1 Intellectual Property',
        paragraphs: [
          'The TrialN1 brand, interface design, Scientific Gatekeeper workflows, missing-parameter auditing logic, software code, and curated sample routines are owned by TrialN1 or its licensors and protected by copyright, trademark, and other intellectual property laws.',
          'Except as expressly permitted by an applicable open-source license in our public repository, you may not copy, resell, sublicense, or commercially exploit the Service without prior written consent.'
        ]
      },
      {
        id: 'availability-changes',
        heading: '6. Service Availability, Demo Modes & Changes',
        paragraphs: [
          'We continuously evolve TrialN1 and may add, modify, suspend, or discontinue features—including temporary evaluation or clinical administrator preview modes—at any time without liability.',
          'We do not guarantee uninterrupted, error-free, or permanently available access to the Service.'
        ]
      },
      {
        id: 'disclaimers-liability',
        heading: '7. Disclaimers & Limitation of Liability',
        paragraphs: [
          'THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, CLINICAL ACCURACY, OR NON-INFRINGEMENT.',
          'TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRIALN1 AND ITS CONTRIBUTORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY PHYSICAL INJURY, HEALTH OUTCOME, OR DATA LOSS ARISING OUT OF YOUR USE OF OR RELIANCE ON THE SERVICE OR ANY ROUTINE GENERATED BY IT.'
        ]
      },
      {
        id: 'indemnification',
        heading: '8. Indemnification',
        paragraphs: [
          'You agree to indemnify and hold harmless TrialN1 and its team from any claims, liabilities, damages, or expenses arising from your violation of these Terms, your misuse of the Service, or your violation of any third-party rights.'
        ]
      },
      {
        id: 'termination',
        heading: '9. Termination',
        paragraphs: [
          'You may stop using TrialN1 or request account deletion at any time. We reserve the right to suspend or terminate access if you breach these Terms, violate our Terms of Use, or pose a security or legal risk to the platform or other users.'
        ]
      },
      {
        id: 'governing-law',
        heading: '10. Governing Law & Contact',
        paragraphs: [
          'These Terms are governed by applicable international digital-commerce principles and the laws of the jurisdiction in which TrialN1 operates, without regard to conflict-of-law rules. Any disputes will first be addressed in good faith through written notice.',
          `Questions regarding these Terms & Conditions may be sent to ${LEGAL_CONTACT_EMAIL}.`
        ]
      }
    ]
  },
  {
    slug: 'terms-of-use',
    href: ROUTES.termsOfUse,
    title: 'Terms of Use',
    shortTitle: 'Terms of Use',
    subtitle:
      'Acceptable use standards, scientific scope boundaries, community conduct, and technical rules for using TrialN1 responsibly.',
    category: 'Acceptable Use',
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    tone: 'sky',
    summaryTitle: 'Responsible use at a glance',
    summaryPoints: [
      'TrialN1 is built strictly for peer-reviewed human interventional research—do not attempt to bypass the Scientific Gatekeeper.',
      'Never upload another person’s private medical records (PHI) without explicit authorization.',
      'Do not scrape, reverse-engineer, rate-limit abuse, or inject malicious prompts into the AI endpoints.',
      'Treat community spaces with respect and never present personal opinions as licensed medical prescriptions.'
    ],
    sections: [
      {
        id: 'scientific-scope',
        heading: '1. Interventional Human Research Scope',
        paragraphs: [
          'TrialN1 is purposefully scoped to human interventional research (such as clinical rehabilitation, exercise protocols, sleep hygiene, circadian lighting, nutrition, behavioral science, and supervised pharmacology).',
          'Our Scientific Gatekeeper intentionally declines non-human animal studies, in-vitro bench papers, purely observational/correlational studies, and non-health theoretical papers. You agree not to attempt to manipulate or jailbreak the Gatekeeper to generate unverified or hazardous routines.'
        ]
      },
      {
        id: 'prohibited-conduct',
        heading: '2. Prohibited Activities',
        paragraphs: ['When using TrialN1, you agree NOT to:'],
        bullets: [
          'Use the Service to generate, distribute, or promote dangerous self-harm regimens, unapproved toxic dosages, or illegal substance protocols.',
          'Upload Protected Health Information (PHI) or identifiable clinical records belonging to third parties without lawful consent.',
          'Attempt to bypass authentication, access controls, API rate limits, or sandbox boundaries.',
          'Use automated bots, scrapers, or stress-testing scripts against our endpoints without prior written authorization.',
          'Submit prompt injections, malware, or corrupted files designed to disrupt server-side PDF or AI processing.'
        ]
      },
      {
        id: 'ai-assistant-rules',
        heading: '3. Using the N1 AI Safety Companion',
        paragraphs: [
          'The N1 AI assistant is designed to answer questions strictly grounded in the Methods section of your active research paper and conservative clinical safety thresholds.',
          'You must not rely on the AI assistant for emergency triage, acute symptom diagnosis, or medication dosing adjustments. Always verify critical parameters directly against the original peer-reviewed publication and with a qualified clinician.'
        ]
      },
      {
        id: 'community-standards',
        heading: '4. Community & Shared Insights',
        paragraphs: [
          'Where TrialN1 provides community adherence insights, reviews, or shared protocol discussions, you agree to contribute constructively, avoid harassment or misinformation, and refrain from impersonating licensed medical professionals.'
        ]
      },
      {
        id: 'enforcement',
        heading: '5. Enforcement & Reporting',
        paragraphs: [
          `We may remove violating content, throttle abusive traffic, or suspend accounts that breach these Terms of Use. To report abuse, security vulnerabilities, or unsafe content, please contact ${LEGAL_CONTACT_EMAIL}.`
        ]
      }
    ]
  },
  {
    slug: 'disclaimer',
    href: ROUTES.disclaimer,
    title: 'Medical & Research Disclaimer',
    shortTitle: 'Medical Disclaimer',
    subtitle:
      'Important clinical safety boundaries: TrialN1 is an informational research-translation tool and not a substitute for professional medical care.',
    category: 'Clinical Safety',
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    tone: 'blush',
    summaryTitle: 'Critical safety notice',
    summaryPoints: [
      'TrialN1 does NOT provide medical advice, diagnosis, or treatment, and creates no doctor-patient relationship.',
      'If you experience severe pain, dizziness, chest pain, or any medical emergency, stop immediately and contact local emergency services.',
      'Missing-parameter defaults (such as conservative hold times or rep tempos) are general educational placeholders—not personalized prescriptions.',
      'Always review any clinical routine or 1-page adherence brief with your physician, physiotherapist, or licensed healthcare specialist.'
    ],
    sections: [
      {
        id: 'not-medical-advice',
        heading: '1. Informational & Educational Purpose Only',
        paragraphs: [
          'All content, structured routines, voice cues, progression rules, biomarker charts, and AI responses generated by TrialN1 are provided strictly for informational, educational, and personal habit-tracking purposes.',
          'Nothing on TrialN1 constitutes medical advice, clinical diagnosis, therapeutic prescription, or a substitute for consultation with a qualified healthcare professional.'
        ]
      },
      {
        id: 'no-provider-relationship',
        heading: '2. No Doctor-Patient Relationship',
        paragraphs: [
          'Using TrialN1—including exporting a 1-Page Clinical Adherence Brief or asking questions to the N1 AI Safety Companion—does not establish a physician-patient, therapist-patient, or clinical care relationship between you and TrialN1.'
        ]
      },
      {
        id: 'missing-parameters',
        heading: '3. Missing Parameter Auditing & Conservative Defaults',
        paragraphs: [
          'Published clinical trials frequently omit granular execution details (such as exact rest intervals, eccentric lowering tempo, or warm-up sets). When TrialN1 detects an omitted parameter, it flags the omission transparently and may suggest a conservative general default.',
          'These defaults are general educational approximations and do not account for your full medical history, comorbidities, medications, injuries, pregnancy, or individual contraindications.'
        ]
      },
      {
        id: 'physical-safety',
        heading: '4. Stop Signals & Medical Emergencies',
        paragraphs: [
          'Before starting any physical rehabilitation, exercise, breathwork, fasting, sleep-restriction, or nutritional protocol, consult your licensed healthcare provider.',
          'If you experience sharp or worsening pain, numbness, shortness of breath, chest pain, faintness, or any adverse reaction, stop the activity immediately and seek professional medical attention or call your local emergency number.'
        ]
      },
      {
        id: 'research-limitations',
        heading: '5. Limitations of Clinical Literature & AI Extraction',
        paragraphs: [
          'Scientific evidence evolves continuously. A single peer-reviewed trial may have small sample sizes, specific inclusion criteria, or findings later superseded by newer research. Automated AI extraction can occasionally misinterpret dense tables, footnotes, or abbreviations—always verify critical instructions against the original source paper.'
        ]
      }
    ]
  },
  {
    slug: 'cookies',
    href: ROUTES.cookies,
    title: 'Cookie & Local Storage Policy',
    shortTitle: 'Cookie Policy',
    subtitle:
      'Transparent breakdown of the browser storage, authentication cookies, and local preferences TrialN1 uses.',
    category: 'Browser Storage',
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    tone: 'lavender',
    summaryTitle: 'Storage at a glance',
    summaryPoints: [
      'We use strictly necessary browser storage and session tokens to keep you signed in and preserve your guest routines.',
      'We store your chosen interface language (English or Arabic) and lifestyle tuning preferences locally for fast loading.',
      'We do NOT deploy third-party advertising trackers, cross-site behavioral pixels, or ad-network cookies.'
    ],
    sections: [
      {
        id: 'what-we-use',
        heading: '1. What Cookies & Storage Technologies We Use',
        paragraphs: [
          'TrialN1 uses a minimal set of browser cookies, IndexedDB entries, and localStorage keys strictly required to deliver the application reliably:'
        ],
        bullets: [
          'Essential Authentication Storage: Firebase Auth session tokens stored in browser storage/IndexedDB so signed-in users stay authenticated across page reloads.',
          'Guest Routine Storage (localStorage): Stores your active routines, daily task check-offs, biofeedback logs, and custom papers locally when using Guest Mode.',
          'Localization & UI Preferences: Remembers your primary and secondary language settings (e.g., English / Arabic RTL) and accessibility preferences.'
        ]
      },
      {
        id: 'no-ad-tracking',
        heading: '2. No Advertising or Cross-Site Tracking',
        paragraphs: [
          'TrialN1 does not sell ad space and does not embed third-party advertising cookies, social-media retargeting pixels, or cross-site behavioral tracking scripts.'
        ]
      },
      {
        id: 'managing-storage',
        heading: '3. How to Manage or Clear Browser Storage',
        paragraphs: [
          'You can clear cookies and localStorage at any time through your browser settings. Please note that clearing localStorage while in Guest Mode will permanently remove unsynced local routines from that browser unless you have signed in to sync them to your cloud account.'
        ]
      }
    ]
  },
  {
    slug: 'ai-transparency',
    href: ROUTES.aiTransparency,
    title: 'AI & Data Transparency Notice',
    shortTitle: 'AI Transparency',
    subtitle:
      'How TrialN1 uses Gemini on Vertex AI, enforces citation grounding, audits missing parameters, and protects your privacy.',
    category: 'AI Governance',
    lastUpdated: LEGAL_EFFECTIVE_DATE,
    tone: 'yellow',
    summaryTitle: 'AI governance at a glance',
    summaryPoints: [
      'Powered by Gemini on Google Cloud Vertex AI via isolated server-side routes—zero model credentials are exposed to your browser.',
      'Every uploaded PDF passes through our Scientific Gatekeeper before routine extraction.',
      'N1 AI answers are prompted to quote the study Methods and explicitly disclose whenever a parameter was not specified in the paper.',
      'AI outputs are assistive tools and should always be double-checked against the source study and professional clinical advice.'
    ],
    sections: [
      {
        id: 'how-ai-works',
        heading: '1. Where AI Is Used in TrialN1',
        paragraphs: ['TrialN1 uses generative AI models (Gemini on Google Cloud Vertex AI) in four clearly defined workflows:'],
        bullets: [
          'Multimodal PDF Ingestion: Reading uploaded clinical research PDFs natively to identify study design, participant population, and intervention steps.',
          'Scientific Gatekeeper: Classifying whether a paper is an actionable human interventional trial and politely declining non-human, purely observational, or theoretical papers.',
          'Missing Parameter Auditing: Highlighting omitted clinical details (e.g., hold durations, dosages, rest periods) and labeling conservative defaults clearly.',
          'N1 AI Safety Companion & Voice Coach: Answering user questions grounded in the active paper and guiding step-by-step execution.'
        ]
      },
      {
        id: 'grounding-limitations',
        heading: '2. Citation Grounding & Known Limitations',
        paragraphs: [
          'Large language models can still make mistakes, especially with complex tables, multi-arm trial subgroups, or ambiguous medical abbreviations. TrialN1 mitigates this by separating verified paper-stated parameters from inferred conservative defaults and displaying source citations.',
          'You remain the decision-maker: review generated routines carefully and consult a licensed healthcare professional before acting on them.'
        ]
      },
      {
        id: 'data-protection-ai',
        heading: '3. Privacy & Enterprise Isolation',
        paragraphs: [
          'All AI inference requests are routed through TrialN1 server-side handlers using Google Cloud Vertex AI enterprise APIs. Your private biofeedback logs and personal account profile are never sold or shared with public advertising networks.'
        ]
      }
    ]
  }
] as const;

export const LEGAL_DOCUMENTS_BY_SLUG: Record<LegalSlug, LegalDocument> = LEGAL_DOCUMENTS.reduce(
  (acc, doc) => {
    acc[doc.slug] = doc;
    return acc;
  },
  {} as Record<LegalSlug, LegalDocument>
);

export function isLegalSlug(value: string): value is LegalSlug {
  return value in LEGAL_DOCUMENTS_BY_SLUG;
}
