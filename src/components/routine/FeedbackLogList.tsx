import React from 'react';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { EmptyState } from '../feedback/EmptyState';
import { FeedbackLogItem } from './FeedbackLogItem';

export function FeedbackLogList() {
  const { feedbackLogs, feedbackMetric } = useProtocol();

  if (feedbackLogs.length === 0) {
    return (
      <EmptyState
        className="mt-4"
        icon={MonitorHeartOutlinedIcon}
        title={COPY.routine.emptyMetricTitle(feedbackMetric?.name)}
        description={COPY.routine.emptyFeedbackBody}
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
