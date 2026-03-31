import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
    tenantId: string;
    tenantName: string;
  }

  interface User {
    tenantId: string;
    tenantName: string;
  }
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  pendingAction?: PendingAction;
}

export interface PendingAction {
  auditLogId: string;
  toolName: string;
  description: string;
  params: Record<string, unknown>;
}

export interface ChatResponse {
  message: ChatMessage;
  conversationId: string;
}
