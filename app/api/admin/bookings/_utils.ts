import type { Booking as DbBooking } from '@prisma/client';
import type { Booking } from '@/app/admin/schedule/_components/types';

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;

export function isBookingStatus(value: string): value is Booking['status'] {
  return (BOOKING_STATUSES as readonly string[]).includes(value);
}

export function parseDateOnlyToUtc(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateUtc(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isValidTimeLabel(value: string): boolean {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export function generateReviewCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part()}-${part()}`;
}

export function toScheduleBooking(booking: DbBooking): Booking {
  return {
    id: booking.id,
    date: formatDateUtc(booking.date),
    time: booking.timeLabel,
    name: booking.name,
    email: booking.email,
    phone: booking.phone || '',
    service: booking.service,
    status: booking.status,
    notes: booking.notes || '',
    reviewCode: booking.reviewCode || '',
    reviewSubmitted: booking.reviewSubmitted,
  };
}
