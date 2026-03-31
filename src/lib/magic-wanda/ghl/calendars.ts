import { GHLClient } from './client';
import type {
  GHLCalendarsResponse,
  GHLFreeSlotsResponse,
  GHLAppointment,
} from './types';

export async function getCalendars(
  client: GHLClient
): Promise<GHLCalendarsResponse> {
  const locationId = await client.getLocationId();
  return client.get<GHLCalendarsResponse>('/calendars/', { locationId });
}

export async function checkAvailability(
  client: GHLClient,
  calendarId: string,
  startDate: string,
  endDate: string
): Promise<GHLFreeSlotsResponse> {
  return client.get<GHLFreeSlotsResponse>(
    `/calendars/${calendarId}/free-slots`,
    { startDate, endDate }
  );
}

export async function bookAppointment(
  client: GHLClient,
  data: {
    calendarId: string;
    contactId: string;
    startTime: string;
    endTime: string;
    title?: string;
    notes?: string;
  }
): Promise<GHLAppointment> {
  const locationId = await client.getLocationId();
  return client.post<GHLAppointment>('/calendars/events/appointments', {
    ...data,
    locationId,
  });
}

export async function rescheduleAppointment(
  client: GHLClient,
  appointmentId: string,
  data: { startTime: string; endTime: string }
): Promise<GHLAppointment> {
  return client.put<GHLAppointment>(
    `/calendars/events/appointments/${appointmentId}`,
    data
  );
}

export async function cancelAppointment(
  client: GHLClient,
  appointmentId: string
): Promise<{ success: boolean }> {
  return client.delete<{ success: boolean }>(
    `/calendars/events/appointments/${appointmentId}`
  );
}
