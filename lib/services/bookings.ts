import type { Booking } from '@/app/admin/schedule/_components/types';

const STORAGE_KEY = 'admin_bookings';

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function loadBookings(): Booking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Booking[];
  } catch {}
  return [];
}

export function saveBookings(bookings: Booking[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {}
}

export function addBooking(data: Omit<Booking, 'id'>): Booking {
  const booking: Booking = Object.assign({ id: generateId(), reviewCode: '', reviewSubmitted: false }, data);
  const bookings = loadBookings();
  bookings.push(booking);
  saveBookings(bookings);
  return booking;
}

export function updateBooking(id: string, updates: Partial<Booking>): Booking | null {
  const bookings = loadBookings();
  const idx = bookings.findIndex((b) => b.id === id);
  if (idx === -1) return null;
  bookings[idx] = { ...bookings[idx], ...updates };
  saveBookings(bookings);
  return bookings[idx];
}

export function deleteBooking(id: string): boolean {
  const bookings = loadBookings();
  const filtered = bookings.filter((b) => b.id !== id);
  if (filtered.length === bookings.length) return false;
  saveBookings(filtered);
  return true;
}

export function getBookingsByDate(date: string): Booking[] {
  return loadBookings().filter((b) => b.date === date);
}

export function generateReviewCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const part = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part()}-${part()}`;
}
