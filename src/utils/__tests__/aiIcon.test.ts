import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { AI_ICON_SIZES, type AIIconSize } from '../../components/ui/AIIcon';
import { COPY } from '../../data/copy';

describe('AIIcon component and configuration', () => {
  it('maps all semantic icon size tokens correctly', () => {
    const expectedSizes: Record<AIIconSize, { px: number; className: string }> = {
      xs: { px: 16, className: 'h-4 w-4' },
      sm: { px: 20, className: 'h-5 w-5' },
      md: { px: 24, className: 'h-6 w-6' },
      lg: { px: 28, className: 'h-7 w-7' },
      xl: { px: 32, className: 'h-8 w-8' },
      '2xl': { px: 40, className: 'h-10 w-10' }
    };

    for (const [size, config] of Object.entries(expectedSizes)) {
      expect(AI_ICON_SIZES[size as AIIconSize]).toEqual(config);
    }
  });

  it('uses the centralized brand favicon icon URL as the AI icon source', () => {
    expect(COPY.brand.iconUrl).toBe('/images/viskotun1-icon.png');
  });

  it('renders AIIcon on Tune with N1 AI action button in Profile instead of sparkle icon', () => {
    const profileSource = fs.readFileSync(
      path.resolve(__dirname, '../../views/Profile.tsx'),
      'utf-8'
    );
    expect(profileSource).toContain('<AIIcon size="xs" />');
    expect(profileSource).toContain('<span>{t.tuneWithAi}</span>');
    expect(profileSource).not.toMatch(/<Icon\s+icon=\{AutoAwesomeOutlinedIcon\}\s+size="xs"\s*\/>\s*<span>\{t\.tuneWithAi\}<\/span>/);

    const bannerSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/routine/AdaptiveLifestyleBanner.tsx'),
      'utf-8'
    );
    expect(bannerSource).toContain('<AIIcon size="xs" />');
    expect(bannerSource).not.toContain('AutoAwesomeOutlinedIcon');
  });
});
