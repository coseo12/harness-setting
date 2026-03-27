'use client';

import { Todo, CATEGORY_MAP, PRIORITY_MAP } from '@/data/types';

interface TodoCardProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

// 할 일 카드 컴포넌트
// 미완료 + high 우선순위 → 다크 카드, 그 외 → 흰색 카드
export default function TodoCard({ todo, onToggle, onDelete }: TodoCardProps) {
  const isDarkCard = !todo.completed && todo.priority === 'high';
  const category = CATEGORY_MAP[todo.category];

  // 우선순위별 뱃지 색상
  const priorityColor: Record<Todo['priority'], string> = {
    high: 'var(--accent-yellow)',
    medium: '#d1d5db',
    low: '#e5e7eb',
  };

  return (
    <div
      className="group relative flex flex-col gap-3 rounded-2xl p-5 transition-all duration-200 hover:scale-[1.02]"
      style={{
        backgroundColor: isDarkCard
          ? 'var(--bg-dark-card)'
          : 'var(--bg-card)',
        boxShadow: 'var(--shadow-neumorphic)',
        opacity: todo.completed ? 0.6 : 1,
      }}
    >
      {/* 상단: 카테고리 아이콘 + 제목 영역 */}
      <div className="flex items-start gap-3">
        {/* 체크박스 */}
        <button
          onClick={() => onToggle(todo.id)}
          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors"
          style={{
            borderColor: isDarkCard
              ? 'rgba(255,255,255,0.4)'
              : 'var(--border)',
            backgroundColor: todo.completed
              ? 'var(--accent-yellow)'
              : 'transparent',
          }}
          aria-label={todo.completed ? '미완료로 변경' : '완료로 변경'}
        >
          {todo.completed && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6L5 9L10 3"
                stroke="var(--text-primary)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* 카테고리 아이콘 */}
          <span className="text-lg">{category.icon}</span>

          {/* 제목 */}
          <h3
            className={`mt-1 text-sm font-semibold leading-tight ${
              todo.completed ? 'line-through-animated' : ''
            }`}
            style={{
              color: isDarkCard
                ? 'var(--text-on-dark)'
                : 'var(--text-primary)',
            }}
          >
            {todo.title}
          </h3>

          {/* 설명 */}
          {todo.description && (
            <p
              className="mt-1 text-xs leading-relaxed"
              style={{
                color: isDarkCard
                  ? 'rgba(255,255,255,0.6)'
                  : 'var(--text-secondary)',
              }}
            >
              {todo.description}
            </p>
          )}
        </div>
      </div>

      {/* 하단: 카테고리 라벨 + 우선순위 뱃지 + 날짜 */}
      <div className="flex items-center gap-2 text-xs">
        <span
          className="rounded-full px-2 py-0.5 font-medium"
          style={{
            backgroundColor: priorityColor[todo.priority],
            color:
              todo.priority === 'high'
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
          }}
        >
          {PRIORITY_MAP[todo.priority]}
        </span>
        <span
          style={{
            color: isDarkCard
              ? 'rgba(255,255,255,0.5)'
              : 'var(--text-muted)',
          }}
        >
          {category.label}
        </span>
        <span
          className="ml-auto"
          style={{
            color: isDarkCard
              ? 'rgba(255,255,255,0.5)'
              : 'var(--text-muted)',
          }}
        >
          {todo.dueDate.slice(5).replace('-', '/')}
        </span>
      </div>

      {/* 삭제 버튼 - hover 시 표시 */}
      <button
        onClick={() => onDelete(todo.id)}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
        style={{
          backgroundColor: isDarkCard
            ? 'rgba(255,255,255,0.15)'
            : 'rgba(0,0,0,0.06)',
        }}
        aria-label="삭제"
      >
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1 1L9 9M9 1L1 9"
            stroke={isDarkCard ? '#fff' : 'var(--text-secondary)'}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
