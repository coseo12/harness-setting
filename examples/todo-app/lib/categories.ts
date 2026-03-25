import type { TodoCategory } from './types';

export interface CategoryConfig {
  label: string;
  icon: string;
  color: string;
  gradient: string;
}

export const CATEGORIES: Record<TodoCategory, CategoryConfig> = {
  personal: {
    label: '개인',
    icon: '👤',
    color: '#4A7DFF',
    gradient: 'linear-gradient(135deg, #4A7DFF, #6C63FF)',
  },
  work: {
    label: '업무',
    icon: '💼',
    color: '#FF6B6B',
    gradient: 'linear-gradient(135deg, #FF6B6B, #FF8E53)',
  },
  health: {
    label: '건강',
    icon: '💪',
    color: '#2ED8A3',
    gradient: 'linear-gradient(135deg, #2ED8A3, #29B6F6)',
  },
  study: {
    label: '학습',
    icon: '📚',
    color: '#FFB74D',
    gradient: 'linear-gradient(135deg, #FFB74D, #FF9800)',
  },
};

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as TodoCategory[];
