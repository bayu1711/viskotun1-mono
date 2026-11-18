import QRCode from 'qrcode';

export interface SocialShareLinks {
  whatsapp: string;
  x: string;
  linkedin: string;
  email: string;
}

/** Resolves the canonical deep-link URL for sharing a specific routine. */
export function getRoutineShareUrl(routineId: string, customOrigin?: string): string {
  let origin = customOrigin;
  if (!origin && typeof window !== 'undefined' && window.location?.origin) {
    origin = window.location.origin;
  }
  const base = origin || 'https://viskotun1.app';
  return `${base}/routine?routineId=${encodeURIComponent(routineId)}`;
}

/** Generates pre-populated share links across primary clinical and social channels. */
export function getSocialShareUrls(shareUrl: string, routineTitle: string, domain?: string): SocialShareLinks {
  const intro = `Follow this clinical routine on ViskotuN1: "${routineTitle}"${domain ? ` (${domain})` : ''}.`;

  const whatsappMessage = `${intro}\n${shareUrl}`;
  const whatsapp = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsappMessage)}`;

  const x = `https://twitter.com/intent/tweet?text=${encodeURIComponent(intro)}&url=${encodeURIComponent(shareUrl)}`;

  const linkedin = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;

  const emailSubject = `ViskotuN1 Clinical Routine: ${routineTitle}`;
  const emailBody = `Hi,\n\nI am sharing this interventional routine on ViskotuN1:\n\n${routineTitle}\n${shareUrl}\n\nThis routine includes structured daily steps, progression rules, and safety stop-rules.`;
  const email = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return { whatsapp, x, linkedin, email };
}

/** Generates a high-contrast data URL QR code image (PNG) for instant mobile camera scanning. */
export async function generateQrCodeDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    color: {
      dark: '#111827', // ink
      light: '#FFFFFF' // white
    },
    errorCorrectionLevel: 'M'
  });
}

/** Checks whether the client environment supports the native Web Share API (mobile devices). */
export function canNativeShare(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/** Triggers native OS share sheet if supported. */
export async function triggerNativeShare(data: { title: string; text: string; url: string }): Promise<boolean> {
  if (!canNativeShare()) return false;
  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    // User cancelled or share aborted
    if ((err as Error)?.name !== 'AbortError') {
      console.warn('[Sharing] Native share error:', err);
    }
    return false;
  }
}
