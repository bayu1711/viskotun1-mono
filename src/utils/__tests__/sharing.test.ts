import { describe, expect, it } from 'vitest';
import {
  canNativeShare,
  generateQrCodeDataUrl,
  getRoutineShareUrl,
  getSocialShareUrls
} from '../sharing';

describe('sharing utility', () => {
  it('constructs correct routine deep-link share URLs', () => {
    const url = getRoutineShareUrl('achilles', 'https://example.com');
    expect(url).toBe('https://example.com/routine?routineId=achilles');
  });

  it('generates properly encoded social share URLs for WhatsApp, X, LinkedIn, and Email', () => {
    const shareUrl = 'https://viskotun1.app/routine?routineId=achilles';
    const title = 'Achilles Tendon Loading';
    const urls = getSocialShareUrls(shareUrl, title, 'Physical Therapy');

    expect(urls.whatsapp).toContain('https://api.whatsapp.com/send?text=');
    expect(urls.whatsapp).toContain(encodeURIComponent(shareUrl));

    expect(urls.x).toContain('https://twitter.com/intent/tweet?');
    expect(urls.x).toContain(encodeURIComponent(shareUrl));

    expect(urls.linkedin).toContain('https://www.linkedin.com/sharing/share-offsite/?');
    expect(urls.linkedin).toContain(encodeURIComponent(shareUrl));

    expect(urls.email).toContain('mailto:?subject=');
    expect(urls.email).toContain(encodeURIComponent('ViskotuN1 Clinical Routine: Achilles Tendon Loading'));
  });

  it('generates a valid QR code data URL', async () => {
    const dataUrl = await generateQrCodeDataUrl('https://viskotun1.app/routine?routineId=achilles');
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });

  it('safely evaluates native share capability without throwing in test environment', () => {
    expect(typeof canNativeShare()).toBe('boolean');
  });
});
