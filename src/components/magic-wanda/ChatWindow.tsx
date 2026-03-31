'use client';

import MessageList from './MessageList';
import ChatInput from './ChatInput';
import type { ChatMessage } from '@/lib/magic-wanda/types';

interface ChatWindowProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (message: string) => void;
  error?: string | null;
}

export default function ChatWindow({ messages, isLoading, onSend, error }: ChatWindowProps) {
  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} isLoading={isLoading} />
      {error && (
        <div className="mx-4 mb-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}
      <ChatInput onSend={onSend} disabled={isLoading} />
    </div>
  );
}
