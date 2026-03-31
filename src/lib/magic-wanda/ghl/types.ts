// GHL Contact
export interface GHLContact {
  id: string;
  locationId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  tags?: string[];
  source?: string;
  dateAdded?: string;
  dateUpdated?: string;
  customFields?: Array<{ id: string; value: string }>;
}

export interface GHLContactsResponse {
  contacts: GHLContact[];
  meta?: { total: number; currentPage: number; nextPage: number | null };
}

// GHL Calendar
export interface GHLCalendar {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  slug?: string;
  isActive: boolean;
}

export interface GHLCalendarsResponse {
  calendars: GHLCalendar[];
}

export interface GHLFreeSlot {
  startTime: string;
  endTime: string;
}

export interface GHLFreeSlotsResponse {
  slots: Record<string, GHLFreeSlot[]>;
}

export interface GHLAppointment {
  id: string;
  calendarId: string;
  locationId: string;
  contactId: string;
  title?: string;
  status: string;
  startTime: string;
  endTime: string;
}

// GHL Conversation
export interface GHLConversation {
  id: string;
  locationId: string;
  contactId: string;
  lastMessageBody?: string;
  lastMessageDate?: string;
  type: string;
  unreadCount: number;
}

export interface GHLConversationsResponse {
  conversations: GHLConversation[];
}

export interface GHLMessage {
  id: string;
  conversationId: string;
  body: string;
  type: number; // 1=SMS, 2=Email, etc.
  direction: string; // "inbound" | "outbound"
  status: string;
  dateAdded: string;
}

export interface GHLMessagesResponse {
  messages: { messages: GHLMessage[] };
}

// GHL Invoice
export interface GHLInvoice {
  _id: string;
  altId: string; // locationId
  name: string;
  title?: string;
  status: string;
  amountDue: number;
  total: number;
  currency: string;
  contactDetails?: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface GHLInvoicesResponse {
  invoices: GHLInvoice[];
  total: number;
}
