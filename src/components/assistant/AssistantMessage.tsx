'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MOTION } from '../../data/config';
import type { ChatMessage } from '../../types/routine';
import { RoutineCard } from '../routine/RoutineCard';
import { AlertCard } from './messages/AlertCard';
import { AnswerBubble } from './messages/AnswerBubble';
import { ConfirmationCard } from './messages/ConfirmationCard';
import { PaperSummaryCard } from './messages/PaperSummaryCard';
import { UserFileBubble } from './messages/UserFileBubble';
import { UserTextBubble } from './messages/UserTextBubble';
import { ProcessingCard } from './ProcessingCard';

import { CandidateProtocolCard } from './messages/CandidateProtocolCard';
import { useRoutine } from '../../contexts/RoutineContext';

interface AssistantMessageProps {
  message: ChatMessage;
}

/** Routes a chat message to the presentational component for its role + kind. */
export function AssistantMessage({ message }: AssistantMessageProps) {
  const {
    stagingProtocol,
    routine,
    protocol = routine,
    confirmStagingProtocol,
    discardStagingProtocol,
    toggleStagingExcludeStep
  } = useRoutine();

  if (message.role === 'user') {
    return message.kind === 'file' ? <UserFileBubble message={message} /> : <UserTextBubble content={message.content} />;
  }

  const renderBody = () => {
    switch (message.kind) {
      case 'text':
        return <PaperSummaryCard intro={message.content} />;
      case 'candidate': {
        const target = stagingProtocol || protocol;
        if (!target) return null;
        return (
          <CandidateProtocolCard
            protocol={target}
            onConfirm={confirmStagingProtocol}
            onDiscard={discardStagingProtocol}
            onToggleExcludeStep={toggleStagingExcludeStep}
          />
        );
      }
      case 'routine':
      case 'protocol':
        return <RoutineCard />;
      case 'processing':
        return <ProcessingCard source={message.content} createdAt={message.createdAt ?? 0} />;
      case 'answer':
        return <AnswerBubble content={message.content} engine={message.engine} source={message.source} />;
      case 'confirmation':
        return <ConfirmationCard content={message.content} />;
      case 'alert':
        return <AlertCard content={message.content} />;
      default:
        return null;
    }
  };

  const body = renderBody();
  if (!body) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: MOTION.messageOffsetY }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION.message}
    >
      {body}
    </motion.div>
  );
}