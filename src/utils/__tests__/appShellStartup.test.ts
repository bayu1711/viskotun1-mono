import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AppShell and Startup Modal Guardrails', () => {
  it('does not mount workspace modals or drawers on public landing/auth pages', () => {
    const appShellPath = path.resolve(__dirname, '../../components/layout/AppShell.tsx');
    const source = fs.readFileSync(appShellPath, 'utf-8');

    const publicBlockMatch = source.match(/if \(isPublicPage\)\s*\{([\s\S]*?)\n\s*\}/);
    expect(publicBlockMatch).not.toBeNull();

    const publicBlock = publicBlockMatch![1];
    expect(publicBlock).not.toContain('<ReEntryModal');
    expect(publicBlock).not.toContain('<HowToModal');
    expect(publicBlock).not.toContain('<FeedbackDrawer');
    expect(publicBlock).not.toContain('<CommunityReviewDrawer');
    expect(publicBlock).not.toContain('<PolicyLedgerDrawer');
    expect(publicBlock).not.toContain('<BctLedgerDrawer');
    expect(publicBlock).not.toContain('<ShareRoutineModal');
  });

  it('does not auto-open ReEntryModal inside checkMidnightRollover on startup', () => {
    const hookPath = path.resolve(__dirname, '../../hooks/useRoutineState.ts');
    const source = fs.readFileSync(hookPath, 'utf-8');

    const rolloverMatch = source.match(
      /const checkMidnightRollover = useCallback\(\(\) => \{([\s\S]*?)\}, \[updateRuntime, pushMessages\]\);/
    );
    expect(rolloverMatch).not.toBeNull();

    const rolloverBody = rolloverMatch![1];
    expect(rolloverBody).not.toContain('setIsReEntryOpen(true)');
    expect(rolloverBody).toContain('pendingReEntryCheckin');
  });
});
