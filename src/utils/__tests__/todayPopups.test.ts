import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe("Today View Dose Mode and Adaptive Lifestyle Popups", () => {
  it('mounts DoseModeModal and AdaptiveLifestyleModal once in AppShell for authenticated workspace', () => {
    const appShellPath = path.resolve(__dirname, '../../components/layout/AppShell.tsx');
    const source = fs.readFileSync(appShellPath, 'utf-8');

    // Verify imported
    expect(source).toContain("import { DoseModeModal } from '../routine/DoseModeModal';");
    expect(source).toContain("import { AdaptiveLifestyleModal } from '../routine/AdaptiveLifestyleModal';");

    // Verify mounted once in the workspace tree
    expect(source).toContain('<DoseModeModal />');
    expect(source).toContain('<AdaptiveLifestyleModal />');

    // Verify NOT mounted in the public block
    const publicBlockMatch = source.match(/if \(isPublicPage\)\s*\{([\s\S]*?)\n\s*\}/);
    expect(publicBlockMatch).not.toBeNull();
    const publicBlock = publicBlockMatch![1];
    expect(publicBlock).not.toContain('<DoseModeModal');
    expect(publicBlock).not.toContain('<AdaptiveLifestyleModal');
  });

  it('exposes modal states and open/close callbacks in useRoutineState', () => {
    const hookPath = path.resolve(__dirname, '../../hooks/useRoutineState.ts');
    const source = fs.readFileSync(hookPath, 'utf-8');

    expect(source).toContain('isDoseModeModalOpen');
    expect(source).toContain('openDoseModeModal');
    expect(source).toContain('closeDoseModeModal');
    expect(source).toContain('isLifestyleModalOpen');
    expect(source).toContain('openLifestyleModal');
    expect(source).toContain('closeLifestyleModal');
  });

  it('removes bulky inline banners from RoutinePage and wires popup buttons in switcherExtra', () => {
    const routineViewPath = path.resolve(__dirname, '../../views/Routine.tsx');
    const source = fs.readFileSync(routineViewPath, 'utf-8');

    // Bulky inline cards must not be mounted inline above TaskGrid
    expect(source).not.toContain('<AdaptiveLifestyleBanner className="mt-4" />');
    expect(source).not.toContain('<DoseModeSelector className="mt-3 mb-3" />');

    // Both popup triggers must be wired in switcherExtra next to papers dropdown
    expect(source).toContain('openLifestyleModal');
    expect(source).toContain('openDoseModeModal');
    expect(source).toContain('openShareModal');

    // Button titles and visual feedback indicators
    expect(source).toContain('activeAdaptation?.regionLabel || copy.schedule.lifestyleButton');
    expect(source).toContain('copy.doseMode[doseMode]');
    expect(source).toContain('PublicOutlinedIcon');
    expect(source).toContain('BoltOutlinedIcon');
  });

  it('verifies DoseModeModal provides accessible options, habit pacing guidance, and re-entry link', () => {
    const modalPath = path.resolve(__dirname, '../../components/routine/DoseModeModal.tsx');
    const source = fs.readFileSync(modalPath, 'utf-8');

    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('useDialogA11y');
    expect(source).toContain('copy.doseMode.standard');
    expect(source).toContain('copy.doseMode.micro');
    expect(source).toContain('copy.doseMode.rest');
    expect(source).toContain('openReEntryModal');
    expect(source).toContain('closeDoseModeModal');
  });

  it('verifies AdaptiveLifestyleModal provides location context, AI tuning, and schedule overrides', () => {
    const modalPath = path.resolve(__dirname, '../../components/routine/AdaptiveLifestyleModal.tsx');
    const source = fs.readFileSync(modalPath, 'utf-8');

    expect(source).toContain('role="dialog"');
    expect(source).toContain('aria-modal="true"');
    expect(source).toContain('useDialogA11y');
    expect(source).toContain('PublicOutlinedIcon');
    expect(source).toContain('refreshLifestyleAdaptation');
    expect(source).toContain('openLifestyleTuning');
    expect(source).toContain('AvailableWindowsEditor');
    expect(source).toContain('closeLifestyleModal');

    // Verify it adheres to design system (AIIcon instead of AutoAwesomeOutlinedIcon, zero Guardrail verified chip)
    expect(source).toContain('<AIIcon size="xs" />');
    expect(source).not.toContain('AutoAwesomeOutlinedIcon');
    expect(source).not.toContain('Guardrail verified');
  });
});
