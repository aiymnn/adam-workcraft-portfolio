import type { Booking } from '@/types/booking';

interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  booking?: T;
  bookings?: T[];
  email?: { success: boolean; message: string };
}

async function assertOk<T>(res: Response): Promise<ApiResponse<T>> {
  const payload = (await res.json()) as ApiResponse<T>;
  if (!res.ok) throw new Error((payload.message as string) || 'Request failed');
  return payload;
}

/** Bookings eligible for review: confirmed + date passed + no review submitted yet */
export async function fetchEligibleForReviewBookings(): Promise<Booking[]> {
  const res = await fetch('/api/admin/bookings/eligible-for-review', {
    method: 'GET',
    credentials: 'same-origin',
    cache: 'no-store',
  });
  const data = await assertOk<Booking>(res);
  return data.bookings || [];
}

/** Generate code + send review invite email in one call */
export async function sendReviewEmail(
  id: string
): Promise<{ booking: Booking; email: { success: boolean; message: string } }> {
  const res = await fetch(`/api/admin/bookings/${id}/send-review-email`, {
    method: 'POST',
    credentials: 'same-origin',
  });
  const data = await assertOk<Booking>(res);
  if (!data.booking) throw new Error('Booking missing in response');
  return {
    booking: data.booking,
    email: data.email || { success: false, message: 'Unknown result' },
  };
}
