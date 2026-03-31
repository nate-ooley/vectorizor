'use client';

import type { ChatMessage } from '@/lib/magic-wanda/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex items-start gap-3 px-4 py-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-neutral-700' : 'bg-purple-600'
        }`}
      >
        <span className="text-sm font-bold text-white">
          {isUser ? 'U' : 'W'}
        </span>
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-purple-600 text-white rounded-tr-sm'
            : 'bg-neutral-800 text-neutral-100 rounded-tl-sm'
        }`}
      >
        <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}
