import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/magic-wanda/auth';
import { prisma } from '@/lib/magic-wanda/db';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { conversationId } = await params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: session.user.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            role: true,
            content: true,
            createdAt: true,
          },
        },
      },
    });

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      conversation: {
        id: conversation.id,
        title: conversation.title,
        messages: conversation.messages.map((msg: { id: string; role: string; content: string; createdAt: Date }) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          createdAt: msg.createdAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    console.error('Failed to load conversation:', error);
    return NextResponse.json({ error: 'Failed to load conversation' }, { status: 500 });
  }
}
