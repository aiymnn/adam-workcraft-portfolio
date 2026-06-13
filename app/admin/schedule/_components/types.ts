// Re-export shared Booking type from the central types folder
export type { Booking } from '@/types/booking';
export type { BookingFormData as FormData } from '@/types/booking';

import { SERVICES, STATUS_STYLES, STATUS_HOVER, STATUS_LABELS } from '@/lib/constants';

export const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  service: SERVICES[0],
  time: '09:00',
  notes: '',
};

export { SERVICES, STATUS_STYLES, STATUS_HOVER, STATUS_LABELS };
