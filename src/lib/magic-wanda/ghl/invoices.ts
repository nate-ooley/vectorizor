import { GHLClient } from './client';
import type { GHLInvoicesResponse, GHLInvoice } from './types';

export async function getInvoices(
  client: GHLClient,
  params?: { contactId?: string; status?: string; limit?: number }
): Promise<GHLInvoicesResponse> {
  const locationId = await client.getLocationId();
  const queryParams: Record<string, string> = { altId: locationId, altType: 'location' };
  if (params?.contactId) queryParams.contactId = params.contactId;
  if (params?.status) queryParams.status = params.status;
  if (params?.limit) queryParams.limit = String(params.limit);
  return client.get<GHLInvoicesResponse>('/invoices/', queryParams);
}

export async function getInvoice(
  client: GHLClient,
  invoiceId: string
): Promise<GHLInvoice> {
  const locationId = await client.getLocationId();
  return client.get<GHLInvoice>(`/invoices/${invoiceId}`, {
    altId: locationId,
    altType: 'location',
  });
}

export async function createInvoice(
  client: GHLClient,
  data: {
    contactId: string;
    name: string;
    title?: string;
    items: Array<{
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
    }>;
    dueDate?: string;
  }
): Promise<GHLInvoice> {
  const locationId = await client.getLocationId();
  return client.post<GHLInvoice>('/invoices/', {
    ...data,
    altId: locationId,
    altType: 'location',
  });
}

export async function voidInvoice(
  client: GHLClient,
  invoiceId: string
): Promise<GHLInvoice> {
  const locationId = await client.getLocationId();
  return client.post<GHLInvoice>(`/invoices/${invoiceId}/void`, {
    altId: locationId,
    altType: 'location',
  });
}
