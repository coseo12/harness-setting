// Todo 앱 데이터 모델 정의

export interface Todo {
  id: string;
  title: string;
  description?: string;
  category: 'work' | 'personal' | 'health' | 'study';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  dueDate: string; // 'YYYY-MM-DD'
  createdAt: string;
}

export interface UserProfile {
  name: string;
  role: string;
  avatar?: string;
}

// 카테고리 한글 라벨 및 아이콘 매핑
export const CATEGORY_MAP: Record<
  Todo['category'],
  { label: string; icon: string }
> = {
  work: { label: '업무', icon: '💼' },
  personal: { label: '개인', icon: '🏠' },
  health: { label: '건강', icon: '🏥' },
  study: { label: '학습', icon: '📚' },
};

// 우선순위 한글 라벨 매핑
export const PRIORITY_MAP: Record<Todo['priority'], string> = {
  high: '높음',
  medium: '보통',
  low: '낮음',
};

// 월 이름 매핑
export const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
