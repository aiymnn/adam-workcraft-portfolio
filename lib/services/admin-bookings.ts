import type { Booking } from '@/app/admin/schedule/_components/types';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  booking?: T;
  bookings?: T[];
}

interface BookingWritePayload {
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  notes: string;
  status?: Booking['status'];
}

async function parseResponse<T>(res: Response): Promise<ApiResponse<T>> {
  try {
    return (await res.json()) as ApiResponse<T>;
  } catch {
    return {};
  }
}

async function assertOk<T>(res: Response): Promise<ApiResponse<T>> {
  const payload = await parseResponse<T>(res);
  if (!res.ok) {
    throw new Error(payload.message || 'Request failed');
  }
  return payload;
}

export async function fetchAdminBookings(): Promise<Booking[]> {
  const res = await fetch('/api/admin/bookings', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk<Booking>(res);
  return data.bookings || [];
}

export async function createAdminBooking(payload: BookingWritePayload): Promise<Booking> {
  const res = await fetch('/api/admin/bookings', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await assertOk<Booking>(res);
  if (!data.booking) throw new Error('Booking missing in response');
  return data.booking;
}

export async function updateAdminBooking(id: string, payload: Partial<BookingWritePayload> & { reviewSubmitted?: boolean; generateReviewCode?: boolean }): Promise<Booking> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: 'PATCH',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await assertOk<Booking>(res);
  if (!data.booking) throw new Error('Booking missing in response');
  return data.booking;
}

export async function deleteAdminBooking(id: string): Promise<void> {
  const res = await fetch(`/api/admin/bookings/${id}`, {
    method: 'DELETE',
    credentials: 'same-origin',
  });
  await assertOk<Booking>(res);
}

export async function generateAdminReviewCode(id: string): Promise<Booking> {
  return updateAdminBooking(id, { generateReviewCode: true });
}
