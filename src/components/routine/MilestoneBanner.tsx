'use client';

import React from 'react';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { useRoutine } from '../../contexts/RoutineContext';
import { Callout } from '../feedback/Callout';
import { AIIcon } from '../ui/AIIcon';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { PillButton } from '../ui/PillButton';

import { useLocale } from '../../contexts/LocaleContext';
export function MilestoneBanner() {
  const { copy } = useLocale();
  const {
    currentDay,
    scheduledFields,
    dataCollectionSpec,
    isCurrentDayMilestone,
    morphingLogs,
    openFeedbackDrawer
  } = useRoutine();

  const pendingWidgetFields = (dataCollectionSpec ?? []).filter(
    (f) => f.proposedWidget?.status === 'pending_review'
  );
  const milestoneFields = isCurrentDayMilestone
    ? scheduledFields.filter((f) => f.frequency === 'milestone')
    : [];

  if (milestoneFields.length === 0 && pendingWidgetFields.length === 0) return null;

  return (
    <div className="space-y-2.5">
      {pendingWidgetFields.map((field) => (
        <Callout
          key={`pending-${field.id}`}
          tone="mint"
          role="status"
          icon={
            <IconTile variant="outline" shape="circle" size={36} className="bg-white/80">
              <AIIcon size="sm" />
            </IconTile>
          }
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h4 className="font-semibold text-ink">
                {copy.morphing.widgets.custom.pendingNotice}
              </h4>
              <p className="mt-0.5 text-xs text-ink/75">
                {field.proposedWidget?.title || field.label} — {copy.morphing.widgets.custom.pendingSubtext}
              </p>
            </div>
            <div className="flex shrink-0 items-center">
              <PillButton
                size="sm"
                variant="outline"
                onClick={() => openFeedbackDrawer(field.id)}
              >
                {copy.morphing.milestone.reviewAction}
              </PillButton>
            </div>
          </div>
        </Callout>
      ))}
      {milestoneFields.map((field) => {
        const isCompleted = morphingLogs.some(
          (log) => log.fieldId === field.id && log.day === currentDay
        );

        const LeadingIcon = field.type === 'photo' ? CameraAltOutlinedIcon : EventAvailableOutlinedIcon;

        return (
          <Callout
            key={field.id}
            tone="peach"
            role="status"
            icon={
              <IconTile variant="outline" shape="circle" size={36} className="bg-white/80">
                <Icon
                  icon={isCompleted ? CheckCircleOutlinedIcon : LeadingIcon}
                  size="sm"
                  className="text-ink"
                />
              </IconTile>
            }
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-ink/60">
                    {copy.morphing.milestoneTag}
                  </span>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-medium text-ink">
                      <Icon icon={CheckCircleOutlinedIcon} size="xs" />
                      {copy.morphing.milestone.completedBadge}
                    </span>
                  )}
                </div>
                <h4 className="mt-0.5 font-medium text-ink">
                  {copy.morphing.milestone.bannerTitle(currentDay)}: {field.label}
                </h4>
                <p className="mt-0.5 text-xs text-ink/70">
                  {field.instructions ?? copy.morphing.milestone.bannerSubtitle}
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <PillButton
                  size="sm"
                  variant={isCompleted ? 'outline' : 'primary'}
                  onClick={() => openFeedbackDrawer(field.id)}
                >
                  {isCompleted ? copy.morphing.milestone.reviewAction : copy.morphing.milestone.action}
                </PillButton>
              </div>
            </div>
          </Callout>
        );
      })}
    </div>
  );
}
