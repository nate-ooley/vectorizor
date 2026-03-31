import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/magic-wanda/auth';
import { prisma } from '@/lib/magic-wanda/db';
import { GHLClient } from '@/lib/magic-wanda/ghl/client';
import { createContact, updateContact } from '@/lib/magic-wanda/ghl/contacts';
import { bookAppointment, rescheduleAppointment, cancelAppointment } from '@/lib/magic-wanda/ghl/calendars';
import { sendSMS, sendEmail } from '@/lib/magic-wanda/ghl/conversations';
import { createInvoice } from '@/lib/magic-wanda/ghl/invoices';

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

    // Load the audit log and verify ownership
    const auditLog = await prisma.auditLog.findUnique({
      where: { id: auditLogId },
    });

    if (!auditLog || auditLog.userId !== session.user.id) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (auditLog.status !== 'proposed') {
      return NextResponse.json({ error: `Action already ${auditLog.status}` }, { status: 409 });
    }

    // Execute the write action
    const client = new GHLClient(auditLog.tenantId);
    const params = JSON.parse(auditLog.inputParams);
    let result: unknown;

    try {
      switch (auditLog.toolName) {
        case 'create_contact':
          result = await createContact(client, params);
          break;
        case 'update_contact': {
          const { contactId, ...updateData } = params;
          result = await updateContact(client, contactId, updateData);
          break;
        }
        case 'book_appointment':
          result = await bookAppointment(client, params);
          break;
        case 'reschedule_appointment': {
          const { appointmentId, ...rescheduleData } = params;
          result = await rescheduleAppointment(client, appointmentId, rescheduleData);
          break;
        }
        case 'cancel_appointment':
          result = await cancelAppointment(client, params.appointmentId);
          break;
        case 'send_sms':
          result = await sendSMS(client, params);
          break;
        case 'send_email':
          result = await sendEmail(client, params);
          break;
        case 'create_invoice':
          result = await createInvoice(client, params);
          break;
        default:
          throw new Error(`Unknown write tool: ${auditLog.toolName}`);
      }

      // Mark as executed
      await prisma.auditLog.update({
        where: { id: auditLogId },
        data: {
          status: 'executed',
          outputResult: JSON.stringify(result),
        },
      });

      return NextResponse.json({ success: true, result });
    } catch (execError) {
      // Mark as failed
      const errorMessage = execError instanceof Error ? execError.message : 'Unknown error';
      await prisma.auditLog.update({
        where: { id: auditLogId },
        data: {
          status: 'failed',
          outputResult: JSON.stringify({ error: errorMessage }),
        },
      });

      return NextResponse.json({ error: `Action failed: ${errorMessage}` }, { status: 500 });
    }
  } catch (error) {
    console.error('Confirm action error:', error);
    return NextResponse.json({ error: 'Failed to confirm action' }, { status: 500 });
  }
}
