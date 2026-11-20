'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import ScienceOutlinedIcon from '@mui/icons-material/ScienceOutlined';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';

import { useLocale } from '../../contexts/LocaleContext';
import { useRoutine } from '../../contexts/RoutineContext';
import { BCT_TAXONOMY_ENTRIES } from '../../data/bctTaxonomy';
import { MOTION } from '../../data/config';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { Icon } from '../ui/Icon';
import { CircleButton } from '../ui/CircleButton';
import { cn } from '../../utils/cn';

type FilterMode = 'all' | 'gulf' | 'habit';

export function BctLedgerDrawer() {
  const { isBctLedgerOpen, closeBctLedger } = useRoutine();
  const { copy, isRtl, locale } = useLocale();
  const [filter, setFilter] = useState<FilterMode>('all');

  const panelRef = useRef<HTMLDivElement>(null);
  useDialogA11y(panelRef, { open: isBctLedgerOpen, onClose: closeBctLedger });

  const t = copy.bctLedger;

  const filteredEntries = useMemo(() => {
    if (filter === 'gulf') {
      return BCT_TAXONOMY_ENTRIES.filter((e) =>
        e.targetBarriers.some((b) =>
          ['extreme_heat_summer', 'healthcare_shift_worker', 'ramadan_fasting', 'midwakh_dokha'].includes(b)
        )
      );
    }
    if (filter === 'habit') {
      return BCT_TAXONOMY_ENTRIES.filter((e) =>
        ['BCT 1.2', 'BCT 8.7', 'BCT 11.2'].includes(e.code)
      );
    }
    return BCT_TAXONOMY_ENTRIES;
  }, [filter]);

  return (
    <AnimatePresence>
      {isBctLedgerOpen && (
        <motion.div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="fixed inset-0 z-dialog flex items-end justify-center sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-ink/40" onClick={closeBctLedger} aria-hidden="true" />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.dialogLabel}
            tabIndex={-1}
            initial={{ y: MOTION.dialogOffsetY, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: MOTION.dialogOffsetY, opacity: 0 }}
            transition={MOTION.dialogSpring}
            className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-sheet bg-white font-sans text-ink shadow-popover focus:outline-none sm:rounded-sheet"
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-ink/10 p-5 sm:p-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-mint/50 px-2.5 py-0.5 text-2xs font-bold text-ink">
                  <Icon icon={ScienceOutlinedIcon} size="xs" />
                  <span>{t.eyebrow}</span>
                </span>
                <h2 className="mt-1.5 font-display text-xl font-extrabold text-ink sm:text-2xl">
                  {t.title}
                </h2>
                <p className="mt-1 max-w-lg text-xs leading-relaxed text-ink/70">
                  {t.subtitle}
                </p>
              </div>

              <CircleButton label={t.closeButton} onClick={closeBctLedger} size={36}>
                <Icon icon={CloseIcon} size="sm" />
              </CircleButton>
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 bg-cream/30 px-5 py-3 sm:px-6">
              <span className="flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-ink/50">
                <Icon icon={FilterListIcon} size="xs" />
                <span>Filter:</span>
              </span>

              <button
                type="button"
                onClick={() => setFilter('all')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer',
                  filter === 'all'
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink/75 hover:bg-ink/5 border border-ink/15'
                )}
              >
                {locale === 'ar' ? 'جميع التقنيات (10)' : 'All Techniques (10)'}
              </button>

              <button
                type="button"
                onClick={() => setFilter('gulf')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer',
                  filter === 'gulf'
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink/75 hover:bg-ink/5 border border-ink/15'
                )}
              >
                {locale === 'ar' ? 'مرونة بيئة الخليج (6)' : 'Gulf Resilience (6)'}
              </button>

              <button
                type="button"
                onClick={() => setFilter('habit')}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-semibold transition-colors cursor-pointer',
                  filter === 'habit'
                    ? 'bg-ink text-white'
                    : 'bg-white text-ink/75 hover:bg-ink/5 border border-ink/15'
                )}
              >
                {locale === 'ar' ? 'حفظ العادات السلوكية (3)' : 'Habit Preservation (3)'}
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.code}
                  className="rounded-2xl border border-ink/10 bg-canvas/40 p-4 transition-colors hover:border-ink/25"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-black text-white">
                        {entry.code}
                      </span>
                      <span className="text-2xs font-semibold uppercase tracking-wider text-ink/60">
                        {entry.cluster}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {entry.targetBarriers.map((barrier) => (
                        <span
                          key={barrier}
                          className="rounded-md bg-white border border-ink/10 px-1.5 py-0.5 text-3xs font-medium text-ink/75"
                        >
                          #{barrier}
                        </span>
                      ))}
                    </div>
                  </div>

                  <h3 className="mt-2 font-display text-base font-bold text-ink">
                    {entry.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-ink/70">
                    {entry.description}
                  </p>

                  <div className="mt-3 space-y-2 border-t border-ink/10 pt-3">
                    <div className="rounded-xl bg-white p-3 border border-ink/10">
                      <p className="text-2xs font-bold uppercase tracking-wider text-ink/60">
                        {t.implementationLabel}:
                      </p>
                      <p className="mt-1 text-xs font-medium text-ink leading-relaxed">
                        {entry.viskotuImplementation}
                      </p>
                    </div>

                    <div className="rounded-xl bg-mint/20 p-2.5 border border-mint/40">
                      <p className="text-2xs font-bold uppercase tracking-wider text-ink/70">
                        {t.mechanismLabel}:
                      </p>
                      <p className="mt-0.5 text-xs text-ink/85 leading-relaxed">
                        {entry.mechanismOfAction}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-ink/10 bg-cream/20 p-4 text-center">
              <span className="text-2xs text-ink/65">
                {locale === 'ar'
                  ? 'مرجعية: Michie et al. (2013) تصنيف تقنيات تغيير السلوك · المعتمد في أبحاث الطب السلوكي'
                  : 'Source: Michie et al. (2013) Behavior Change Technique Taxonomy v1 · Annals of Behavioral Medicine'}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
