'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Todo, TodoFilter, TodoCategory } from '@/lib/types';
import { fetchTodos } from '@/lib/api-client';
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/categories';
import { AddTodo } from './AddTodo';
import { TodoList } from './TodoList';

const FILTERS: { label: string; value: TodoFilter }[] = [
  { label: '전체', value: '' },
  { label: '진행 중', value: 'active' },
  { label: '완료', value: 'completed' },
];

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [dateStr, setDateStr] = useState('');

  // 클라이언트에서만 날짜 계산 — 서버/클라이언트 불일치(hydration mismatch) 방지
  useEffect(() => {
    setDateStr(
      new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }),
    );
  }, []);

  const loadTodos = useCallback(async () => {
    try {
      const data = await fetchTodos(filter);
      setTodos(data);
    } catch (err) {
      console.error('할 일 로드 실패:', err);
    }
  }, [filter]);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // 통계 계산 (전체 기준)
  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, active, progress };
  }, [todos]);

  // 카테고리별 카운트
  const categoryCounts = useMemo(() => {
    const counts: Record<TodoCategory, number> = { personal: 0, work: 0, health: 0, study: 0 };
    todos.forEach((t) => {
      const cat = t.category || 'personal';
      if (cat in counts) counts[cat]++;
    });
    return counts;
  }, [todos]);

  return (
    <div className="todo-app">
      {/* 헤더 */}
      <header className="app-header">
        <div className="header-top">
          <div>
            <p className="header-date">{dateStr}</p>
            <h1 className="header-title">할 일 목록</h1>
          </div>
          <div className="header-avatar">
            <span>{'🚀'}</span>
          </div>
        </div>

        {/* 진행률 카드 */}
        <div className="progress-card">
          <div className="progress-info">
            <span className="progress-label">오늘의 진행률</span>
            <span className="progress-value">{stats.progress}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${stats.progress}%` }} />
          </div>
          <div className="progress-stats">
            <span>{stats.completed} 완료</span>
            <span>{stats.active} 남음</span>
          </div>
        </div>
      </header>

      {/* 카테고리 */}
      <section className="categories-section">
        <h2 className="section-title">카테고리</h2>
        <div className="category-grid">
          {CATEGORY_KEYS.map((key) => {
            const cat = CATEGORIES[key];
            return (
              <div key={key} className="category-card" style={{ background: cat.gradient }}>
                <span className="category-icon">{cat.icon}</span>
                <span className="category-label">{cat.label}</span>
                <span className="category-count">{categoryCounts[key]}개</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 필터 + 추가 버튼 */}
      <section className="tasks-section">
        <div className="tasks-header">
          <h2 className="section-title">할 일</h2>
          <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? '✕' : '＋'}
          </button>
        </div>

        {showAddForm && (
          <AddTodo
            onAdd={() => {
              loadTodos();
              setShowAddForm(false);
            }}
          />
        )}

        <div className="filters">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={`filter-btn ${filter === f.value ? 'active' : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <TodoList todos={todos} onChange={loadTodos} />
      </section>
    </div>
  );
}
