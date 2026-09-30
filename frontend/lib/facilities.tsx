import {
  Dumbbell,
  Bike,
  Flame,
  Flower2,
  Bath,
  Waves,
  Car,
  Lock,
  ShowerHead,
  UserCheck,
  Snowflake,
  Music,
  Wifi,
  Sparkles,
} from 'lucide-react';

const ICONS: Record<string, typeof Dumbbell> = {
  'weight-training': Dumbbell,
  cardio: Bike,
  crossfit: Flame,
  yoga: Flower2,
  'steam-room': Bath,
  sauna: Waves,
  parking: Car,
  locker: Lock,
  shower: ShowerHead,
  'personal-trainer': UserCheck,
  ac: Snowflake,
  music: Music,
  wifi: Wifi,
};

export function FacilityIcon({ slug, className }: { slug: string; className?: string }) {
  const Icon = ICONS[slug] ?? Sparkles;
  return <Icon className={className ?? 'h-4 w-4'} aria-hidden="true" />;
}

export const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatTime(hhmm: string | null | undefined): string {
  if (!hhmm) return '—';
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}
