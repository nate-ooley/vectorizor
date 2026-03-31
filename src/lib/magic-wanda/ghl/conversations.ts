import { GHLClient } from './client';
import type {
  GHLConversationsResponse,
  GHLMessagesResponse,
} from './types';

export async function getConversations(
  client: GHLClient,
  contactId?: string
): Promise<GHLConversationsResponse> {
  const locationId = await client.getLocationId();
  const params: Record<string, string> = { locationId };
  if (contactId) params.contactId = contactId;
  return client.get<GHLConversationsResponse>('/conversations/', params);
}

export async function getConversationMessages(
  client: GHLClient,
  conversationId: string
): Promise<GHLMessagesResponse> {
  return client.get<GHLMessagesResponse>(
    `/conversations/${conversationId}/messages`
  );
}

export async function sendSMS(
  client: GHLClient,
  data: { contactId: string; message: string }
): Promise<{ conversationId: string; messageId: string }> {
  return client.post<{ conversationId: string; messageId: string }>(
    '/conversations/messages',
    {
      type: 'SMS',
      contactId: data.contactId,
      message: data.message,
    }
  );
}

export async function sendEmail(
  client: GHLClient,
  data: {
    contactId: string;
    subject: string;
    body: string;
    html?: string;
  }
): Promise<{ conversationId: string; messageId: string }> {
  return client.post<{ conversationId: string; messageId: string }>(
    '/conversations/messages',
    {
      type: 'Email',
      contactId: data.contactId,
      subject: data.subject,
      message: data.body,
      html: data.html || data.body,
    }
  );
}
