import { SERVICES, STATUS_STYLES, STATUS_HOVER, STATUS_LABELS } from '@/lib/constants';

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

export const EMPTY_FORM: FormData = {
  name: '',
  email: '',
  phone: '',
  service: SERVICES[0],
  time: '09:00',
  notes: '',
};

export { SERVICES, STATUS_STYLES, STATUS_HOVER, STATUS_LABELS };
