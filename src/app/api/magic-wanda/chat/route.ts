import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/magic-wanda/auth';
import { handleChat } from '@/lib/magic-wanda/claude/handler';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationId } = await request.json();

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (message.length > 10000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 });
    }

    const result = await handleChat({
      userId: session.user.id,
      tenantId: (session as { tenantId: string }).tenantId,
      tenantName: (session as { tenantName: string }).tenantName,
      userName: session.user.name,
      conversationId: conversationId || undefined,
      userMessage: message.trim(),
    });

    return NextResponse.json({
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: result.assistantMessage,
        createdAt: new Date().toISOString(),
        pendingAction: result.pendingAction,
      },
      conversationId: result.conversationId,
    });
  } catch (error) {
    console.error('Chat error:', error);

    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        { error: 'AI service not configured. Please set your ANTHROPIC_API_KEY.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
