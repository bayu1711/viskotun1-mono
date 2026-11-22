import { describe, expect, it } from 'vitest';
import { detectImageType } from '../imageType';

describe('detectImageType', () => {
  it('identifies JPEG magic bytes', () => {
    const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
    expect(detectImageType(bytes)).toEqual({ mime: 'image/jpeg', ext: 'jpg' });
  });

  it('identifies PNG magic bytes', () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
    expect(detectImageType(bytes)).toEqual({ mime: 'image/png', ext: 'png' });
  });

  it('identifies GIF magic bytes', () => {
    const bytes = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    expect(detectImageType(bytes)).toEqual({ mime: 'image/gif', ext: 'gif' });
  });

  it('identifies WebP magic bytes', () => {
    const bytes = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00,
      0x57, 0x45, 0x42, 0x50
    ]);
    expect(detectImageType(bytes)).toEqual({ mime: 'image/webp', ext: 'webp' });
  });

  it('rejects SVG files', () => {
    const bytes = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(detectImageType(bytes)).toBeNull();
  });

  it('rejects HTML and scripts', () => {
    const bytes = new TextEncoder().encode('<html><script>alert(1)</script></html>');
    expect(detectImageType(bytes)).toBeNull();
  });

  it('rejects arbitrary binary data', () => {
    const bytes = new Uint8Array([0x00, 0x01, 0x02, 0x03]);
    expect(detectImageType(bytes)).toBeNull();
  });
});
