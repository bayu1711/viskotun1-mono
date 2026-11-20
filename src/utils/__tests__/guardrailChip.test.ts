import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Guardrail verified chip removal', () => {
  it('does not render Guardrail verified chip in AdaptiveLifestyleBanner', () => {
    const bannerSource = fs.readFileSync(
      path.resolve(__dirname, '../../components/routine/AdaptiveLifestyleBanner.tsx'),
      'utf-8'
    );

    // Verify chip text in English and Arabic is omitted
    expect(bannerSource).not.toContain('Guardrail verified');
    expect(bannerSource).not.toContain('موثق بضوابط السلامة');

    // Verify VerifiedUserOutlinedIcon is not imported or rendered
    expect(bannerSource).not.toContain('VerifiedUserOutlinedIcon');
  });

  it('ensures no user-facing component renders unnecessary Guardrail verified chip', () => {
    const componentsDir = path.resolve(__dirname, '../../components');
    const getTsxFiles = (dir: string): string[] => {
      let results: string[] = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          // Exclude internal admin policy ledger which manages actual admin Firestore thresholds
          if (file !== 'admin') {
            results = results.concat(getTsxFiles(fullPath));
          }
        } else if (file.endsWith('.tsx')) {
          results.push(fullPath);
        }
      }
      return results;
    };

    const files = getTsxFiles(componentsDir);
    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      expect(content).not.toContain('Guardrail verified');
      expect(content).not.toContain('موثق بضوابط السلامة');
    }
  });
});
