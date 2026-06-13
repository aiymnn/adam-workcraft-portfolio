// Shared Booking type — used across admin and public submit-review pages
export interface Booking {
  id: string;
  date: string;
  time: string;
  name: string;
  email: string;
  phone: string;
  service: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  notes: string;
  reviewCode: string;
  reviewSubmitted: boolean;
}

export interface BookingFormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  time: string;
  notes: string;
  date?: string;
  status?: Booking['status'];
}
