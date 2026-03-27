'use client';

import { useState, useMemo } from 'react';
import { Todo } from '@/data/types';
import { currentUser, initialTodos } from '@/data/mock';
import ProfileCard from '@/components/ProfileCard';
import StatCard from '@/components/StatCard';
import TodoCard from '@/components/TodoCard';
import FilterTabs from '@/components/FilterTabs';
import MonthTimeline from '@/components/MonthTimeline';
import AddTodoModal from '@/components/AddTodoModal';

// 필터 카테고리 목록
const FILTER_CATEGORIES = [
  { key: 'all', label: '전체' },
  { key: 'work', label: '업무' },
  { key: 'personal', label: '개인' },
  { key: 'health', label: '건강' },
  { key: 'study', label: '학습' },
];

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(3); // 기본: 3월
  const [showAddModal, setShowAddModal] = useState(false);

  // 통계 계산
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, rate };
  }, [todos]);

  // 월별 할 일 수 계산
  const todoCountByMonth = useMemo(() => {
    const counts: Record<number, number> = {};
    todos.forEach((todo) => {
      const month = parseInt(todo.dueDate.split('-')[1], 10);
      counts[month] = (counts[month] || 0) + 1;
    });
    return counts;
  }, [todos]);

  // 필터링된 할 일 목록 (카테고리 + 월 기준)
  const filteredTodos = useMemo(() => {
    return todos.filter((todo) => {
      const monthMatch =
        parseInt(todo.dueDate.split('-')[1], 10) === selectedMonth;
      const categoryMatch =
        selectedCategory === 'all' || todo.category === selectedCategory;
      return monthMatch && categoryMatch;
    });
  }, [todos, selectedCategory, selectedMonth]);

  // 주차별 그룹핑 (타임라인용)
  const weekGroups = useMemo(() => {
    const groups: Record<string, Todo[]> = {};
    filteredTodos.forEach((todo) => {
      const day = parseInt(todo.dueDate.split('-')[2], 10);
      // 주차 계산: 1~7 → 1주, 8~14 → 2주, 15~21 → 3주, 22~31 → 4주
      const week = Math.ceil(day / 7);
      const key = `${selectedMonth}월 ${week}주`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(todo);
    });
    return groups;
  }, [filteredTodos, selectedMonth]);

  // 할 일 완료 토글
  const handleToggle = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // 할 일 삭제
  const handleDelete = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // 할 일 추가
  const handleAdd = (
    newTodo: Omit<Todo, 'id' | 'createdAt' | 'completed'>
  ) => {
    const todo: Todo = {
      ...newTodo,
      id: Date.now().toString(),
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setTodos((prev) => [...prev, todo]);
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      {/* 상단: 타이틀 + 필터 탭 */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}
            aria-label="닫기"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 1L11 11M11 1L1 11"
                stroke="var(--text-secondary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <h1
            className="text-xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Todo Dashboard
          </h1>
        </div>
        <FilterTabs
          categories={FILTER_CATEGORIES}
          selected={selectedCategory}
          onSelect={setSelectedCategory}
        />
      </header>

      {/* 프로필 + 통계 섹션 */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <ProfileCard user={currentUser} />
        <StatCard label="총 태스크" value={stats.total} />
        <StatCard label="완료" value={stats.completed} />
        <StatCard label="완료율" value={stats.rate} suffix="%" />
      </section>

      {/* 타임라인 섹션 */}
      <section className="flex flex-col gap-4">
        {/* 타임라인 라인 + 노드 */}
        {Object.keys(weekGroups).length > 0 && (
          <div className="relative px-4">
            {/* 가로 타임라인 라인 */}
            <div
              className="absolute left-0 right-0 top-3 h-0.5"
              style={{ backgroundColor: 'var(--border)' }}
            />
            {/* 주차 노드 */}
            <div className="relative flex justify-between">
              {Object.keys(weekGroups).map((weekLabel) => (
                <div key={weekLabel} className="flex flex-col items-center">
                  <div
                    className="h-6 w-6 rounded-full"
                    style={{ backgroundColor: 'var(--accent-yellow)' }}
                  />
                  <span
                    className="mt-2 text-xs font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {weekLabel}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 할 일 카드 그리드 */}
        {filteredTodos.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTodos.map((todo) => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <div
            className="flex flex-col items-center justify-center rounded-2xl py-16"
            style={{
              backgroundColor: 'var(--bg-card)',
              boxShadow: 'var(--shadow)',
            }}
          >
            <span className="text-4xl">📝</span>
            <p
              className="mt-3 text-sm"
              style={{ color: 'var(--text-muted)' }}
            >
              이 달에는 할 일이 없습니다
            </p>
          </div>
        )}
      </section>

      {/* 하단 타임라인 바 */}
      <MonthTimeline
        selectedMonth={selectedMonth}
        todoCountByMonth={todoCountByMonth}
        onSelectMonth={setSelectedMonth}
      />

      {/* FAB: 할 일 추가 버튼 */}
      <button
        onClick={() => setShowAddModal(true)}
        className="fixed bottom-8 right-8 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold shadow-lg transition-transform hover:scale-110"
        style={{
          backgroundColor: 'var(--accent-yellow)',
          color: 'var(--text-primary)',
          boxShadow: '0 4px 20px rgba(245, 213, 71, 0.4)',
        }}
        aria-label="할 일 추가"
      >
        +
      </button>

      {/* 추가 모달 */}
      {showAddModal && (
        <AddTodoModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
