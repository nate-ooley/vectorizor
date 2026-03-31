'use client';

import { useState, useCallback } from 'react';
import type { ChatMessage, PendingAction } from '@/lib/magic-wanda/types';

export function useMagicWanda() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setError(null);
    setIsLoading(true);
    setPendingAction(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch('/api/magic-wanda/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          conversationId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to send message');
        return;
      }

      setConversationId(data.conversationId);
      setMessages((prev) => [...prev, data.message]);

      // Check for pending action
      if (data.message.pendingAction) {
        setPendingAction(data.message.pendingAction);
      }
    } catch {
      setError('Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const confirmAction = useCallback(async () => {
    if (!pendingAction) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/magic-wanda/actions/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditLogId: pendingAction.auditLogId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to confirm action');
        return;
      }

      // Add confirmation message
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Done! The action "${pendingAction.description}" was completed successfully.`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setPendingAction(null);
    } catch {
      setError('Failed to confirm action. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [pendingAction]);

  const rejectAction = useCallback(async () => {
    if (!pendingAction) return;

    try {
      await fetch('/api/magic-wanda/actions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditLogId: pendingAction.auditLogId }),
      });

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'No problem, I cancelled that action.',
          createdAt: new Date().toISOString(),
        },
      ]);
      setPendingAction(null);
    } catch {
      setError('Failed to cancel action.');
    }
  }, [pendingAction]);

  const startNewConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    setPendingAction(null);
  }, []);

  return {
    messages,
    conversationId,
    isLoading,
    error,
    pendingAction,
    sendMessage,
    confirmAction,
    rejectAction,
    startNewConversation,
  };
}
