import { GHLClient } from '../ghl/client';
import { searchContacts, getContact } from '../ghl/contacts';
import { getCalendars, checkAvailability } from '../ghl/calendars';
import { getConversations, getConversationMessages } from '../ghl/conversations';
import { getInvoices, getInvoice } from '../ghl/invoices';

/**
 * Executes a read-only GHL tool and returns the result as a JSON string.
 */
export async function executeReadTool(
  toolName: string,
  input: Record<string, unknown>,
  tenantId: string
): Promise<string> {
  const client = new GHLClient(tenantId);

  try {
    let result: unknown;

    switch (toolName) {
      case 'search_contacts':
        result = await searchContacts(client, input.query as string);
        break;
      case 'get_contact':
        result = await getContact(client, input.contactId as string);
        break;
      case 'get_calendars':
        result = await getCalendars(client);
        break;
      case 'check_availability':
        result = await checkAvailability(
          client,
          input.calendarId as string,
          input.startDate as string,
          input.endDate as string
        );
        break;
      case 'get_conversations':
        result = await getConversations(client, input.contactId as string | undefined);
        break;
      case 'get_conversation_messages':
        result = await getConversationMessages(client, input.conversationId as string);
        break;
      case 'get_invoices':
        result = await getInvoices(client, {
          contactId: input.contactId as string | undefined,
          status: input.status as string | undefined,
        });
        break;
      case 'get_invoice':
        result = await getInvoice(client, input.invoiceId as string);
        break;
      default:
        return JSON.stringify({ error: `Unknown read tool: ${toolName}` });
    }

    return JSON.stringify(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return JSON.stringify({ error: message });
  }
}
