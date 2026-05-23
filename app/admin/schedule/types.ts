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
}

export interface FormData {
  name: string;
  email: string;
  phone: string;
  service: string;
  time: string;
  notes: string;
  date?: string;
  status?: Booking['status'];
}

export const SERVICES = [
  'Brand Consultation',
  'UI/UX Design Review',
  'Website Strategy',
  'Photography Session',
  'Social Media Audit',
  'Content Writing',
  'Other',
] as const;

export const STATUS_STYLES: Record<Booking['status'], string> = {
  confirmed: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  pending: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  cancelled: 'bg-red-900/40 text-red-300 border-red-700/50',
};

export const STATUS_HOVER: Record<Booking['status'], string> = {
  confirmed: 'hover:bg-emerald-800/60',
  pending: 'hover:bg-amber-800/60',
  cancelled: 'hover:bg-red-800/60',
};

export const STATUS_LABELS: Record<Booking['status'], string> = {
  confirmed: 'Confirmed',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

export const EMPTY_FORM: FormData = {
  name: '',
  email: '',
  phone: '',
  service: SERVICES[0],
  time: '09:00',
  notes: '',
};
