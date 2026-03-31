import type { Tool } from './types';

// Tools that only read data - execute immediately
export const READ_TOOLS = new Set([
  'search_contacts',
  'get_contact',
  'get_calendars',
  'check_availability',
  'get_conversations',
  'get_conversation_messages',
  'get_invoices',
  'get_invoice',
]);

// Tools that modify data - require user confirmation
export const WRITE_TOOLS = new Set([
  'create_contact',
  'update_contact',
  'book_appointment',
  'reschedule_appointment',
  'cancel_appointment',
  'send_sms',
  'send_email',
  'create_invoice',
]);

// Human-readable descriptions for write actions
export const WRITE_ACTION_DESCRIPTIONS: Record<string, string> = {
  create_contact: 'Create a new contact',
  update_contact: 'Update an existing contact',
  book_appointment: 'Book a new appointment',
  reschedule_appointment: 'Reschedule an appointment',
  cancel_appointment: 'Cancel an appointment',
  send_sms: 'Send an SMS message',
  send_email: 'Send an email',
  create_invoice: 'Create a new invoice',
};

const READ_TOOL_DEFINITIONS: Tool[] = [
  {
    name: 'search_contacts',
    description: 'Search for contacts in GoHighLevel CRM by name, email, or phone number.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search term (name, email, or phone number)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_contact',
    description: 'Get detailed information about a specific contact by their ID.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'The contact ID' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'get_calendars',
    description: 'List all calendars available in the GoHighLevel account.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'check_availability',
    description: 'Check available time slots for a specific calendar within a date range.',
    input_schema: {
      type: 'object' as const,
      properties: {
        calendarId: { type: 'string', description: 'The calendar ID to check' },
        startDate: { type: 'string', description: 'Start date in YYYY-MM-DD format' },
        endDate: { type: 'string', description: 'End date in YYYY-MM-DD format' },
      },
      required: ['calendarId', 'startDate', 'endDate'],
    },
  },
  {
    name: 'get_conversations',
    description: 'List recent conversations, optionally filtered by contact.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'Optional contact ID to filter conversations' },
      },
    },
  },
  {
    name: 'get_conversation_messages',
    description: 'Get messages from a specific conversation thread.',
    input_schema: {
      type: 'object' as const,
      properties: {
        conversationId: { type: 'string', description: 'The conversation ID' },
      },
      required: ['conversationId'],
    },
  },
  {
    name: 'get_invoices',
    description: 'List invoices, optionally filtered by contact or status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'Optional contact ID to filter invoices' },
        status: { type: 'string', description: 'Optional status filter (draft, sent, paid, void)' },
      },
    },
  },
  {
    name: 'get_invoice',
    description: 'Get detailed information about a specific invoice.',
    input_schema: {
      type: 'object' as const,
      properties: {
        invoiceId: { type: 'string', description: 'The invoice ID' },
      },
      required: ['invoiceId'],
    },
  },
];

const WRITE_TOOL_DEFINITIONS: Tool[] = [
  {
    name: 'create_contact',
    description: 'Create a new contact in GoHighLevel CRM. Describe what you plan to do and wait for user confirmation before calling this.',
    input_schema: {
      type: 'object' as const,
      properties: {
        firstName: { type: 'string', description: 'First name' },
        lastName: { type: 'string', description: 'Last name' },
        email: { type: 'string', description: 'Email address' },
        phone: { type: 'string', description: 'Phone number' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to add' },
      },
    },
  },
  {
    name: 'update_contact',
    description: 'Update an existing contact. Describe what you plan to change and wait for user confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'The contact ID to update' },
        firstName: { type: 'string', description: 'New first name' },
        lastName: { type: 'string', description: 'New last name' },
        email: { type: 'string', description: 'New email address' },
        phone: { type: 'string', description: 'New phone number' },
        tags: { type: 'array', items: { type: 'string' }, description: 'New tags' },
      },
      required: ['contactId'],
    },
  },
  {
    name: 'book_appointment',
    description: 'Book an appointment on a calendar. Describe the appointment details and wait for user confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        calendarId: { type: 'string', description: 'Calendar ID' },
        contactId: { type: 'string', description: 'Contact ID for the appointment' },
        startTime: { type: 'string', description: 'Start time in ISO 8601 format' },
        endTime: { type: 'string', description: 'End time in ISO 8601 format' },
        title: { type: 'string', description: 'Appointment title' },
        notes: { type: 'string', description: 'Appointment notes' },
      },
      required: ['calendarId', 'contactId', 'startTime', 'endTime'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Reschedule an existing appointment to a new time. Describe the change and wait for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        appointmentId: { type: 'string', description: 'Appointment ID' },
        startTime: { type: 'string', description: 'New start time in ISO 8601 format' },
        endTime: { type: 'string', description: 'New end time in ISO 8601 format' },
      },
      required: ['appointmentId', 'startTime', 'endTime'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancel an existing appointment. Describe which appointment and wait for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        appointmentId: { type: 'string', description: 'Appointment ID to cancel' },
      },
      required: ['appointmentId'],
    },
  },
  {
    name: 'send_sms',
    description: 'Send an SMS text message to a contact. Describe the message and wait for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'Contact ID to send to' },
        message: { type: 'string', description: 'The SMS message text' },
      },
      required: ['contactId', 'message'],
    },
  },
  {
    name: 'send_email',
    description: 'Send an email to a contact. Describe the email and wait for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'Contact ID to send to' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Email body text' },
      },
      required: ['contactId', 'subject', 'body'],
    },
  },
  {
    name: 'create_invoice',
    description: 'Create a new invoice for a contact. Describe the invoice details and wait for confirmation.',
    input_schema: {
      type: 'object' as const,
      properties: {
        contactId: { type: 'string', description: 'Contact ID to invoice' },
        name: { type: 'string', description: 'Invoice name/reference' },
        title: { type: 'string', description: 'Invoice title' },
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'Item name' },
              description: { type: 'string', description: 'Item description' },
              quantity: { type: 'number', description: 'Quantity' },
              unitPrice: { type: 'number', description: 'Price per unit in cents' },
            },
            required: ['name', 'quantity', 'unitPrice'],
          },
          description: 'Line items for the invoice',
        },
        dueDate: { type: 'string', description: 'Due date in YYYY-MM-DD format' },
      },
      required: ['contactId', 'name', 'items'],
    },
  },
];

export function getToolDefinitions(hasGhlConnection: boolean): Tool[] {
  if (!hasGhlConnection) return [];
  return [...READ_TOOL_DEFINITIONS, ...WRITE_TOOL_DEFINITIONS];
}

export function isReadTool(name: string): boolean {
  return READ_TOOLS.has(name);
}

export function isWriteTool(name: string): boolean {
  return WRITE_TOOLS.has(name);
}
