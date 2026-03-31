import type Anthropic from '@anthropic-ai/sdk';

export type MessageParam = Anthropic.MessageParam;
export type ContentBlock = Anthropic.ContentBlock;
export type ToolUseBlock = Anthropic.ToolUseBlock;
export type TextBlock = Anthropic.TextBlock;
export type Tool = Anthropic.Tool;

export interface HandlerResult {
  assistantMessage: string;
  conversationId: string;
  pendingAction?: {
    auditLogId: string;
    toolName: string;
    description: string;
    params: Record<string, unknown>;
  };
}
