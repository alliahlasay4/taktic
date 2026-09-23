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

  // Map keys and legacy unicode emojis to vector components
  if (key.includes('flame') || key.includes('🔥') || key.includes('streak')) {
    return <Flame className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('water') || key.includes('droplet') || key.includes('💧') || key.includes('hydration')) {
    return <Droplets className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('book') || key.includes('read') || key.includes('📚') || key.includes('learn')) {
    return <BookOpen className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('run') || key.includes('walk') || key.includes('exercise') || key.includes('🏃') || key.includes('activity')) {
    return <Activity className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('meditate') || key.includes('zen') || key.includes('heart') || key.includes('🧘') || key.includes('health')) {
    return <Heart className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('morning') || key.includes('sunrise') || key.includes('🌅')) {
    return <Sunrise className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('afternoon') || key.includes('sun') || key.includes('☀️')) {
    return <Sun className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('evening') || key.includes('night') || key.includes('moon') || key.includes('🌙')) {
    return <Moon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('chart') || key.includes('stats') || key.includes('📊')) {
    return <BarChart2 className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('coffee') || key.includes('break') || key.includes('☕')) {
    return <Coffee className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('target') || key.includes('goal') || key.includes('🎯')) {
    return <Target className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('zap') || key.includes('energy') || key.includes('⚡')) {
    return <Zap className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('shield') || key.includes('freeze') || key.includes('🛡️')) {
    return <Shield className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }
  if (key.includes('trophy') || key.includes('reward') || key.includes('🏆')) {
    return <Award className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
  }

  return <FallbackIcon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
};
