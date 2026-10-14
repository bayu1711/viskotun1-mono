import React from 'react';
import { motion } from 'framer-motion';
import { MOTION } from '../../data/config';
import type { ChatMessage } from '../../types/protocol';
import { ProtocolCard } from '../protocol/ProtocolCard';
import { AlertCard } from './messages/AlertCard';
import { AnswerBubble } from './messages/AnswerBubble';
import { ConfirmationCard } from './messages/ConfirmationCard';
import { PaperSummaryCard } from './messages/PaperSummaryCard';
import { UserFileBubble } from './messages/UserFileBubble';
import { UserTextBubble } from './messages/UserTextBubble';
import { ProcessingCard } from './ProcessingCard';

interface AssistantMessageProps {
  message: ChatMessage;
  onLogPain: () => void;
}

/** Routes a chat message to the presentational component for its role + kind. */
export function AssistantMessage({ message, onLogPain }: AssistantMessageProps) {
  if (message.role === 'user') {
    return message.kind === 'file' ? <UserFileBubble message={message} /> : <UserTextBubble content={message.content} />;
  }

  const body = renderAiMessage(message, onLogPain);
  if (!body) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: MOTION.messageOffsetY }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION.message}>
      
      {body}
    </motion.div>);

}

function renderAiMessage(message: ChatMessage, onLogPain: () => void) {
  switch (message.kind) {
    case 'text':
      return <PaperSummaryCard intro={message.content} />;
    case 'protocol':
      return <ProtocolCard onLogPain={onLogPain} />;
    case 'processing':
      return <ProcessingCard source={message.content} createdAt={message.createdAt ?? 0} />;
    case 'answer':
      return <AnswerBubble content={message.content} />;
    case 'confirmation':
      return <ConfirmationCard content={message.content} />;
    case 'alert':
      return <AlertCard content={message.content} />;
    default:
      return null;
  }
}