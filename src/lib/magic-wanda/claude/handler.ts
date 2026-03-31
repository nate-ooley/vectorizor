import { getAnthropicClient } from './client';
import { buildSystemPrompt } from './system-prompt';
import { getToolDefinitions, isReadTool, isWriteTool, WRITE_ACTION_DESCRIPTIONS } from './tools';
import { executeReadTool } from './tool-executor';
import { prisma } from '../db';
import type { HandlerResult, MessageParam, TextBlock, ToolUseBlock } from './types';
import type Anthropic from '@anthropic-ai/sdk';

interface HandleChatOptions {
  userId: string;
  tenantId: string;
  tenantName: string;
  userName?: string | null;
  conversationId?: string;
  userMessage: string;
}

const MAX_TOOL_ROUNDS = 5; // Prevent infinite loops

export async function handleChat(options: HandleChatOptions): Promise<HandlerResult> {
  const { userId, tenantId, tenantName, userName, userMessage } = options;
  let { conversationId } = options;

  const anthropic = getAnthropicClient();

  // Create or load conversation
  if (!conversationId) {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: userMessage.slice(0, 100),
      },
    });
    conversationId = conversation.id;
  }

  // Save user message
  await prisma.message.create({
    data: {
      conversationId,
      role: 'user',
      content: userMessage,
    },
  });

  // Load conversation history
  const dbMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: 'asc' },
    take: 50,
  });

  // Build Claude messages from history
  const messages: MessageParam[] = dbMessages.map((msg: { role: string; content: string }) => ({
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }));

  // Check if tenant has GHL connection
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });
  const hasGhlConnection = !!tenant?.ghlAccessToken;

  // Get available tools
  const tools = getToolDefinitions(hasGhlConnection);
  const systemPrompt = buildSystemPrompt(tenantName, userName);

  // Tool-use loop: Claude may call multiple read tools in sequence
  const currentMessages = [...messages];
  let finalTextResponse = '';
  let pendingAction: HandlerResult['pendingAction'] = undefined;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: systemPrompt,
      messages: currentMessages,
      ...(tools.length > 0 ? { tools } : {}),
    });

    // Extract text from this response
    const textBlocks = response.content.filter((block): block is TextBlock => block.type === 'text');
    const textContent = textBlocks.map((block) => block.text).join('\n');

    // Check for tool calls
    const toolCalls = response.content.filter((block): block is ToolUseBlock => block.type === 'tool_use');

    if (toolCalls.length === 0) {
      // No tool calls — we're done
      finalTextResponse = textContent || 'I processed your request.';
      break;
    }

    // Check if any tool call is a write tool
    const writeToolCall = toolCalls.find((tc) => isWriteTool(tc.name));

    if (writeToolCall) {
      // Write tool detected — propose action, don't execute
      const auditLog = await prisma.auditLog.create({
        data: {
          userId,
          tenantId,
          action: writeToolCall.name,
          status: 'proposed',
          toolName: writeToolCall.name,
          inputParams: JSON.stringify(writeToolCall.input),
        },
      });

      pendingAction = {
        auditLogId: auditLog.id,
        toolName: writeToolCall.name,
        description: WRITE_ACTION_DESCRIPTIONS[writeToolCall.name] || writeToolCall.name,
        params: writeToolCall.input as Record<string, unknown>,
      };

      finalTextResponse = textContent || `I'd like to ${WRITE_ACTION_DESCRIPTIONS[writeToolCall.name]?.toLowerCase() || 'perform an action'}. Please confirm or reject.`;
      break;
    }

    // All tool calls are read tools — execute them and continue the loop
    // Build the assistant message content (text + tool_use blocks)
    const assistantContent: Anthropic.ContentBlockParam[] = [];
    if (textContent) {
      assistantContent.push({ type: 'text', text: textContent });
    }
    for (const tc of toolCalls) {
      assistantContent.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.name,
        input: tc.input as Record<string, unknown>,
      });
    }

    currentMessages.push({
      role: 'assistant',
      content: assistantContent,
    });

    // Execute each read tool and build tool_result messages
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const tc of toolCalls) {
      if (isReadTool(tc.name)) {
        const result = await executeReadTool(tc.name, tc.input as Record<string, unknown>, tenantId);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: tc.id,
          content: result,
        });
      }
    }

    currentMessages.push({
      role: 'user',
      content: toolResults,
    });

    // If the response indicates end_turn (no more tools needed), break
    if (response.stop_reason === 'end_turn') {
      finalTextResponse = textContent || 'I processed your request.';
      break;
    }
  }

  // Save assistant message
  await prisma.message.create({
    data: {
      conversationId,
      role: 'assistant',
      content: finalTextResponse,
    },
  });

  // Update conversation title if it's the first exchange
  if (dbMessages.length <= 1) {
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { title: userMessage.slice(0, 100) },
    });
  }

  return {
    assistantMessage: finalTextResponse,
    conversationId: conversationId!,
    pendingAction,
  };
}
