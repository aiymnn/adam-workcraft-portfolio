export const SERVICES = [
  'Brand Consultation',
  'UI/UX Design Review',
  'Website Strategy',
  'Photography Session',
  'Social Media Audit',
  'Content Writing',
  'Other',
] as const;

export const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/50',
  pending: 'bg-amber-900/40 text-amber-300 border-amber-700/50',
  cancelled: 'bg-red-900/40 text-red-300 border-red-700/50',
};

export const STATUS_HOVER: Record<string, string> = {
  confirmed: 'hover:bg-emerald-800/60',
  pending: 'hover:bg-amber-800/60',
  cancelled: 'hover:bg-red-800/60',
};

export const STATUS_CLASSES: Record<string, string> = {
  pending: 'bg-amber-900/40 text-amber-300',
  confirmed: 'bg-emerald-900/40 text-emerald-300',
  cancelled: 'bg-red-900/40 text-red-300',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};
