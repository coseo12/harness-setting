'use client';

import { useState, useEffect } from 'react';
import type { Todo } from '@/lib/types';
import { updateTodo, deleteTodo } from '@/lib/api-client';
import { CATEGORIES } from '@/lib/categories';

interface TodoItemProps {
  todo: Todo;
  onChange: () => void;
}

export function TodoItem({ todo, onChange }: TodoItemProps) {
  const cat = CATEGORIES[todo.category || 'personal'];
  const [timeAgo, setTimeAgo] = useState('');

  // 클라이언트에서만 시간 계산 — hydration mismatch 방지
  useEffect(() => {
    function update() {
      const diff = Date.now() - new Date(todo.createdAt).getTime();
      const min = Math.floor(diff / 60000);
      if (min < 1) return setTimeAgo('방금');
      if (min < 60) return setTimeAgo(`${min}분 전`);
      const hour = Math.floor(min / 60);
      if (hour < 24) return setTimeAgo(`${hour}시간 전`);
      const day = Math.floor(hour / 24);
      setTimeAgo(`${day}일 전`);
    }
    update();
  }, [todo.createdAt]);

  async function handleToggle() {
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      onChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : '수정 실패');
    }
  }

  async function handleDelete() {
    try {
      await deleteTodo(todo.id);
      onChange();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제 실패');
    }
  }

  return (
    <li className={`todo-item ${todo.completed ? 'completed' : ''}`}>
      <div
        className="todo-category-dot"
        style={{ background: cat.color }}
        title={cat.label}
      />
      <div className="todo-content" onClick={handleToggle}>
        <div className="todo-header-row">
          <span className="todo-title">{todo.title}</span>
          {timeAgo && <span className="todo-time">{timeAgo}</span>}
        </div>
        {todo.description && <p className="todo-desc">{todo.description}</p>}
        <span className="todo-category-tag" style={{ color: cat.color }}>
          {cat.icon} {cat.label}
        </span>
      </div>
      <div className="todo-actions">
        <button
          className={`check-btn ${todo.completed ? 'checked' : ''}`}
          onClick={handleToggle}
          aria-label={todo.completed ? '완료 취소' : '완료'}
        >
          {todo.completed ? '✓' : ''}
        </button>
        <button className="delete-btn" onClick={handleDelete} aria-label="삭제">
          ✕
        </button>
      </div>
    </li>
  );
}
