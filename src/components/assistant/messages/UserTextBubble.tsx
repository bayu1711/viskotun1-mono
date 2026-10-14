import React from 'react';

interface UserTextBubbleProps {
  content: string;
}

export function UserTextBubble({ content }: UserTextBubbleProps) {
  return (
    <div className="flex justify-end">
      <p className="max-w-bubble rounded-bubble rounded-br-md bg-ink px-4 py-2.5 text-sm text-white">{content}</p>
    </div>);

}