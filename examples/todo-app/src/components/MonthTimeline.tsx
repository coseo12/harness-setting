'use client';

import { MONTH_NAMES } from '@/data/types';

interface MonthTimelineProps {
  selectedMonth: number; // 1~12
  todoCountByMonth: Record<number, number>;
  onSelectMonth: (month: number) => void;
}

// 하단 월별 타임라인 네비게이션 컴포넌트
export default function MonthTimeline({
  selectedMonth,
  todoCountByMonth,
  onSelectMonth,
}: MonthTimelineProps) {
  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-neumorphic)',
      }}
    >
      <div className="scrollbar-hide flex gap-1 overflow-x-auto">
        {MONTH_NAMES.map((name, index) => {
          const month = index + 1;
          const isSelected = selectedMonth === month;
          const count = todoCountByMonth[month] || 0;

          return (
            <button
              key={month}
              onClick={() => onSelectMonth(month)}
              className="relative flex shrink-0 flex-col items-center rounded-xl px-3 py-2 transition-all duration-200"
              style={{
                backgroundColor: isSelected
                  ? 'var(--accent-yellow)'
                  : 'transparent',
                minWidth: 52,
              }}
            >
              <span
                className="text-xs font-semibold"
                style={{
                  color: isSelected
                    ? 'var(--text-primary)'
                    : 'var(--text-muted)',
                }}
              >
                {name}
              </span>
              {/* 할 일 수 뱃지 */}
              {count > 0 && (
                <span
                  className="mt-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--text-primary)'
                      : 'var(--border)',
                    color: isSelected
                      ? 'var(--accent-yellow)'
                      : 'var(--text-secondary)',
                  }}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
