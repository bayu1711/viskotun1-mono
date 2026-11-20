import React from 'react';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import { useRoutine } from '../../contexts/RoutineContext';
import { EmptyState } from '../feedback/EmptyState';
import { FeedbackLogItem } from './FeedbackLogItem';

import { useLocale } from '../../contexts/LocaleContext';
export function FeedbackLogList() {
  const { copy } = useLocale();
  const { feedbackLogs, feedbackMetric } = useRoutine();

  if (feedbackLogs.length === 0) {
    return (
      <EmptyState
        className="mt-4"
        icon={MonitorHeartOutlinedIcon}
        title={copy.routine.emptyMetricTitle(feedbackMetric?.name)}
        description={copy.routine.emptyFeedbackBody}
      />
    );
  }

  const latestFirst = [...feedbackLogs].reverse();

  return (
    <ul className="mt-4 space-y-2">
      {latestFirst.map((log) => (
        <FeedbackLogItem key={log.id} log={log} />
      ))}
    </ul>
  );
}
