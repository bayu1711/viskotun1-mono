import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../../data/navigation';
import { COPY } from '../../data/copy';
import { COPY_AR } from '../../data/locales';

describe('UAE & Abu Dhabi Edition Contracts and Routing', () => {
  it('defines the /uae route contract', () => {
    expect(ROUTES.uae).toBe('/uae');
  });

  it('contains complete English UAE landing copy contracts', () => {
    const uae = COPY.uaeLanding;
    expect(uae.challengeBadge).toContain('Future Health Digital Innovation Challenge');
    expect(uae.challengeBadge).toContain('Abu Dhabi');
    expect(uae.challengeSubbadge).toContain('Challenge 09: Sustaining Healthy Behaviors');
    expect(uae.heroTitle).toContain('Abu Dhabi & the UAE');
    expect(uae.trustMetrics.noStreakBreakTitle).toBe('Zero Streak Shame');
    expect(uae.simulator.barrierHeat).toContain('48°C');
    expect(uae.simulator.barrierShift).toContain('Shift');
    expect(uae.simulator.barrierRamadan).toContain('Ramadan');
    const cards = uae.routineCards;
    expect(cards.heat.title).toContain('Heat');
    expect(cards.ramadan.title).toContain('Ramadan');
    expect(cards.midwakh.title).toContain('Midwakh');
    expect(uae.clinicalBriefPoints.length).toBeGreaterThanOrEqual(3);
  });

  it('contains complete authentic Arabic UAE landing copy contracts', () => {
    const uaeAr = COPY_AR.uaeLanding;
    expect(uaeAr.challengeBadge).toContain('تحدي الابتكار الصحي الرقمي للمستقبل');
    expect(uaeAr.challengeBadge).toContain('أبوظبي');
    expect(uaeAr.challengeSubbadge).toContain('التحدي 09: استدامة السلوكيات الصحية');
    expect(uaeAr.heroTitle).toContain('أبوظبي والإمارات');
    expect(uaeAr.trustMetrics.noStreakBreakTitle).toContain('العادات');
    expect(uaeAr.trustMetrics.microDoseTitle).toContain('الخطوات الميسّرة');
    expect(uaeAr.simulator.barrierHeat).toContain('48° مئوية');
    expect(uaeAr.simulator.barrierShift).toContain('نوبة عمل');
    expect(uaeAr.simulator.barrierRamadan).toContain('صيام شهر رمضان');
    const cardsAr = uaeAr.routineCards;
    expect(cardsAr.midwakh.title).toContain('المدواخ والدخة');
  });

  it('guarantees Landing.tsx provides discoverable access to /uae', () => {
    const landingPath = path.resolve(__dirname, '../../views/Landing.tsx');
    const content = fs.readFileSync(landingPath, 'utf-8');
    expect(content).toContain('href={ROUTES.uae}');
    expect(content).toContain('uaeEditionLink');
  });

  it('verifies src/app/uae/page.tsx conforms to Next.js 14 Server Component guidelines', () => {
    const pagePath = path.resolve(__dirname, '../../app/uae/page.tsx');
    expect(fs.existsSync(pagePath)).toBe(true);
    const content = fs.readFileSync(pagePath, 'utf-8');
    expect(content).toContain("export const metadata");
    expect(content).toContain("UaeLandingView");
    expect(content).not.toContain("'use client'");
  });

  it('verifies src/views/UaeLanding.tsx is marked use client and wires design tokens', () => {
    const viewPath = path.resolve(__dirname, '../../views/UaeLanding.tsx');
    expect(fs.existsSync(viewPath)).toBe(true);
    const content = fs.readFileSync(viewPath, 'utf-8');
    expect(content.startsWith("'use client'")).toBe(true);
    expect(content).toContain('useLocale');
    expect(content).toContain('useAuth');
    expect(content).toContain('useAssistant');
    expect(content).toContain('isRtl');
  });
});
