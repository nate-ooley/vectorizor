import { NextResponse } from 'next/server';
import { auth } from '@/lib/magic-wanda/auth';
import { prisma } from '@/lib/magic-wanda/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
  }
}
