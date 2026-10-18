'use client';

import React from 'react';
import CloseIcon from '@mui/icons-material/Close';
import HistoryIcon from '@mui/icons-material/History';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import { COPY } from '../../data/copy';
import type { ProtocolChangelogEntry } from '../../types/routine';
import { AIIcon } from '../ui/AIIcon';
import { Icon } from '../ui/Icon';

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperTitle: string;
  currentVersion?: string;
  changelog?: ProtocolChangelogEntry[];
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  paperTitle,
  currentVersion = '1.0',
  changelog = []
}: VersionHistoryModalProps) {
  if (!isOpen) return null;

  const entries = changelog && changelog.length > 0 ? changelog : [
    {
      version: currentVersion,
      date: new Date().toISOString(),
      summary: 'Initial clinical protocol extraction from published peer-reviewed paper.',
      author: 'Viskotu Scientific Board'
    }
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-history-title"
      className="fixed inset-0 z-modal flex items-center justify-center p-4"
    >
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-lg rounded-sheet bg-white p-6 shadow-elevation-3 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-ink/10 pb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cream border border-ink/15 px-2.5 py-0.5 text-2xs font-semibold text-ink">
                <Icon icon={HistoryIcon} size="xs" />
                <span>v{currentVersion}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-mint/50 border border-mint px-2 py-0.5 text-3xs font-medium text-ink">
                <Icon icon={VerifiedUserOutlinedIcon} size="xs" />
                <span>{COPY.community.versionApprovedBadge}</span>
              </span>
            </div>
            <h2 id="version-history-title" className="text-base font-semibold text-ink leading-snug">
              {COPY.community.versionHistoryTitle}
            </h2>
            <p className="text-xs text-ink/65 line-clamp-1">{paperTitle}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-ink hover:text-ink focus:outline-none"
            aria-label={COPY.community.closeVersionModal}
          >
            <Icon icon={CloseIcon} size="xs" />
          </button>
        </div>

        {/* Changelog Timeline */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {entries.map((entry, idx) => {
            const isLatest = idx === 0;
            return (
              <div
                key={`${entry.version}-${idx}`}
                className={`rounded-card border p-3.5 space-y-2 ${
                  isLatest
                    ? 'border-mint/60 bg-mint/10'
                    : 'border-ink/10 bg-canvas/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-ink">
                      v{entry.version}
                    </span>
                    {isLatest && (
                      <span className="rounded bg-mint px-1.5 py-0.5 text-3xs font-semibold text-ink">
                        {COPY.community.versionCurrentBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-3xs text-ink/50">
                    {new Date(entry.date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>

                <p className="text-xs text-ink/80 leading-relaxed">
                  {entry.summary}
                </p>

                {(entry.addedFields || entry.updatedFields) && (
                  <div className="space-y-1 pt-1 border-t border-ink/5">
                    <p className="text-3xs font-semibold text-ink/60">
                      {COPY.community.versionChangesLabel}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {entry.addedFields?.map((f, i) => (
                        <span
                          key={`add-${i}`}
                          className="rounded bg-mint/40 px-1.5 py-0.5 text-3xs font-mono text-ink"
                        >
                          +{f}
                        </span>
                      ))}
                      {entry.updatedFields?.map((f, i) => (
                        <span
                          key={`up-${i}`}
                          className="rounded bg-yellow/40 px-1.5 py-0.5 text-3xs font-mono text-ink"
                        >
                          ~{f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {entry.author && (
                  <div className="flex items-center gap-1 text-3xs text-ink/50 pt-1">
                    <AIIcon size="xs" />
                    <span>{COPY.community.versionAuthorLabel(entry.author)}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-ink/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-ink px-4 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            {COPY.community.closeVersionModal}
          </button>
        </div>
      </div>
    </div>
  );
}
