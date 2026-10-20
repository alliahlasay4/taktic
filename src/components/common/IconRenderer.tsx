import React from 'react';
import {
  Flame,
  Droplets,
  BookOpen,
  Activity,
  Heart,
  Sun,
  Moon,
  Sunrise,
  BarChart2,
  Sparkles,
  Target,
  Coffee,
  Zap,
  Shield,
  Award,
  LucideProps,
} from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  strokeWidth?: number;
  fallback?: React.ComponentType<LucideProps>;
}

// Static lookup mapping for Lucide icon components
const ICON_COMPONENT_MAP: Record<string, React.ComponentType<LucideProps>> = {
  flame: Flame,
  '🔥': Flame,
  streak: Flame,
  water: Droplets,
  droplet: Droplets,
  droplets: Droplets,
  '💧': Droplets,
  hydration: Droplets,
  book: BookOpen,
  read: BookOpen,
  '📚': BookOpen,
  learn: BookOpen,
  run: Activity,
  walk: Activity,
  exercise: Activity,
  '🏃': Activity,
  activity: Activity,
  meditate: Heart,
  zen: Heart,
  heart: Heart,
  '🧘': Heart,
  health: Heart,
  morning: Sunrise,
  sunrise: Sunrise,
  '🌅': Sunrise,
  afternoon: Sun,
  sun: Sun,
  '☀️': Sun,
  evening: Moon,
  night: Moon,
  moon: Moon,
  '🌙': Moon,
  chart: BarChart2,
  stats: BarChart2,
  '📊': BarChart2,
  coffee: Coffee,
  break: Coffee,
  '☕': Coffee,
  target: Target,
  goal: Target,
  '🎯': Target,
  zap: Zap,
  energy: Zap,
  '⚡': Zap,
  shield: Shield,
  freeze: Shield,
  '🛡️': Shield,
  trophy: Award,
  reward: Award,
  '🏆': Award,
};

function getIconComponent(key: string): React.ComponentType<LucideProps> | null {
  if (ICON_COMPONENT_MAP[key]) return ICON_COMPONENT_MAP[key];

  // Substring match fallback for composite category/icon names
  for (const [pattern, IconComp] of Object.entries(ICON_COMPONENT_MAP)) {
    if (key.includes(pattern)) return IconComp;
  }
  return null;
}

export const IconRenderer: React.FC<IconRendererProps> = ({
  name,
  className = 'h-4 w-4',
  strokeWidth = 1.5,
  fallback: FallbackIcon = Sparkles,
}) => {
  if (!name) {
    return <FallbackIcon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  const key = name.toLowerCase().trim();
  const IconComponent = getIconComponent(key) || FallbackIcon;

  return <IconComponent className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
};
