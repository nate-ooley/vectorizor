import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/magic-wanda/auth';
import { prisma } from '@/lib/magic-wanda/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { auditLogId } = await request.json();
    if (!auditLogId) {
      return NextResponse.json({ error: 'auditLogId is required' }, { status: 400 });
    }

    const auditLog = await prisma.auditLog.findUnique({
      where: { id: auditLogId },
    });

    if (!auditLog || auditLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (auditLog.status !== 'proposed') {
      return NextResponse.json({ error: `Action already ${auditLog.status}` }, { status: 409 });
    }

    await prisma.auditLog.update({
      where: { id: auditLogId },
      data: { status: 'rejected' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reject action error:', error);
    return NextResponse.json({ error: 'Failed to reject action' }, { status: 500 });
  }
}
