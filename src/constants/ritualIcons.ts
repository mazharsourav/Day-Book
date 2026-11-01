import { RitualIconType } from '@/types';
import {
  Apple,
  Bed,
  Bike,
  BookOpen,
  Brain,
  CircleDot,
  Coffee,
  Droplets,
  Dumbbell,
  Flame,
  Flower2,
  Footprints,
  Heart,
  Leaf,
  LucideIcon,
  Moon,
  Music,
  PenLine,
  Sun,
  Wind,
} from 'lucide-react-native';
import { normalizeIcon } from './iconKeys';

export { PICKER_ICONS, normalizeIcon } from './iconKeys';

export const RITUAL_ICON_MAP: Record<RitualIconType, { Icon: LucideIcon; label: string }> = {
  flame: { Icon: Flame, label: 'Flame' },
  leaf: { Icon: Leaf, label: 'Leaf' },
  book: { Icon: BookOpen, label: 'Book' },
  flower: { Icon: Flower2, label: 'Flower' },
  cup: { Icon: Coffee, label: 'Cup' },
  moon: { Icon: Moon, label: 'Moon' },
  dumbbell: { Icon: Dumbbell, label: 'Workout' },
  water: { Icon: Droplets, label: 'Water' },
  pen: { Icon: PenLine, label: 'Writing' },
  music: { Icon: Music, label: 'Music' },
  heart: { Icon: Heart, label: 'Heart' },
  sun: { Icon: Sun, label: 'Sun' },
  bed: { Icon: Bed, label: 'Sleep' },
  bike: { Icon: Bike, label: 'Bike' },
  mind: { Icon: Brain, label: 'Mind' },
  steps: { Icon: Footprints, label: 'Walk' },
  apple: { Icon: Apple, label: 'Food' },
  breath: { Icon: Wind, label: 'Breathe' },
  dot: { Icon: CircleDot, label: 'Ritual' },
};

export function getRitualIcon(icon: unknown): { Icon: LucideIcon; label: string } {
  return RITUAL_ICON_MAP[normalizeIcon(icon)];
}
