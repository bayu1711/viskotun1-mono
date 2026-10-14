import React from 'react';
import MonitorHeartOutlinedIcon from '@mui/icons-material/MonitorHeartOutlined';
import { useProtocol } from '../../contexts/ProtocolContext';
import { COPY } from '../../data/copy';
import { EmptyState } from '../feedback/EmptyState';
import { PainLogItem } from './PainLogItem';

export function PainLogList() {
  const { painLogs } = useProtocol();

  if (painLogs.length === 0) {
    return (
      <EmptyState
        className="mt-4"
        icon={MonitorHeartOutlinedIcon}
        title={COPY.routine.emptyPainTitle}
        description={COPY.routine.emptyPainBody} />);


  }

  const latestFirst = [...painLogs].reverse();

  return (
    <ul className="mt-4 space-y-2">
      {latestFirst.map((log) =>
      <PainLogItem key={log.id} log={log} />
      )}
    </ul>);

}