'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Todo, TodoFilter } from '@/lib/types';
import { fetchTodos } from '@/lib/api-client';
import { AddTodo } from './AddTodo';
import { TodoList } from './TodoList';

const FILTERS: { label: string; value: TodoFilter }[] = [
  { label: '전체', value: '' },
  { label: '미완료', value: 'active' },
  { label: '완료', value: 'completed' },
];

export function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<TodoFilter>('');

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

  return (
    <div className="todo-app">
      <h1>할 일 목록</h1>
      <AddTodo onAdd={loadTodos} />
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
    </div>
  );
}
