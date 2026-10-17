'use client';

import React from 'react';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import { useRoutine } from '../../contexts/RoutineContext';
import { COPY } from '../../data/copy';
import { Callout } from '../feedback/Callout';
import { Icon } from '../ui/Icon';
import { IconTile } from '../ui/IconTile';
import { PillButton } from '../ui/PillButton';

export function MilestoneBanner() {
  const { currentDay, scheduledFields, isCurrentDayMilestone, morphingLogs, openFeedbackDrawer } =
    useRoutine();

  if (!isCurrentDayMilestone) return null;

  const milestoneFields = scheduledFields.filter((f) => f.frequency === 'milestone');
  if (milestoneFields.length === 0) return null;

  return (
    <div className="space-y-2.5">
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
                    {COPY.morphing.milestoneTag}
                  </span>
                  {isCompleted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink/10 px-2 py-0.5 text-[11px] font-medium text-ink">
                      <Icon icon={CheckCircleOutlinedIcon} size="xs" />
                      {COPY.morphing.milestone.completedBadge}
                    </span>
                  )}
                </div>
                <h4 className="mt-0.5 font-medium text-ink">
                  {COPY.morphing.milestone.bannerTitle(currentDay)}: {field.label}
                </h4>
                <p className="mt-0.5 text-xs text-ink/70">
                  {field.instructions ?? COPY.morphing.milestone.bannerSubtitle}
                </p>
              </div>

              <div className="flex shrink-0 items-center">
                <PillButton
                  size="sm"
                  variant={isCompleted ? 'outline' : 'primary'}
                  onClick={() => openFeedbackDrawer(field.id)}
                >
                  {isCompleted ? COPY.morphing.milestone.reviewAction : COPY.morphing.milestone.action}
                </PillButton>
              </div>
            </div>
          </Callout>
        );
      })}
    </div>
  );
}
