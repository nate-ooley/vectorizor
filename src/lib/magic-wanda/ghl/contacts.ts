import { GHLClient } from './client';
import type { GHLContactsResponse, GHLContact } from './types';

export async function searchContacts(
  client: GHLClient,
  query: string,
  limit = 20
): Promise<GHLContactsResponse> {
  const locationId = await client.getLocationId();
  return client.get<GHLContactsResponse>('/contacts/', {
    locationId,
    query,
    limit: String(limit),
  });
}

export async function getContact(
  client: GHLClient,
  contactId: string
): Promise<{ contact: GHLContact }> {
  return client.get<{ contact: GHLContact }>(`/contacts/${contactId}`);
}

export async function createContact(
  client: GHLClient,
  data: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    tags?: string[];
  }
): Promise<{ contact: GHLContact }> {
  const locationId = await client.getLocationId();
  return client.post<{ contact: GHLContact }>('/contacts/', {
    ...data,
    locationId,
  });
}

export async function updateContact(
  client: GHLClient,
  contactId: string,
  data: {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    tags?: string[];
  }
): Promise<{ contact: GHLContact }> {
  return client.put<{ contact: GHLContact }>(`/contacts/${contactId}`, data);
}
