'use client';

import { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import type { ChatMessage } from '@/lib/magic-wanda/types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export default function MessageList({ messages, isLoading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-purple-600/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#10024;</span>
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Hi, I&apos;m Magic Wanda!</h2>
          <p className="text-neutral-400 text-sm">
            Your AI assistant for GoHighLevel. Ask me to search contacts, check calendars,
            send messages, manage invoices, and more.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-neutral-800/50 rounded-lg p-3 text-left text-neutral-400">
              &ldquo;Find contact John Smith&rdquo;
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-3 text-left text-neutral-400">
              &ldquo;Check my calendar for tomorrow&rdquo;
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-3 text-left text-neutral-400">
              &ldquo;Send a text to Sarah about our meeting&rdquo;
            </div>
            <div className="bg-neutral-800/50 rounded-lg p-3 text-left text-neutral-400">
              &ldquo;Create an invoice for $500&rdquo;
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="py-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
