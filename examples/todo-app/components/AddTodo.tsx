'use client';

import { useState, type FormEvent } from 'react';
import type { TodoCategory } from '@/lib/types';
import { createTodo } from '@/lib/api-client';
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/categories';

interface AddTodoProps {
  onAdd: () => void;
}

export function AddTodo({ onAdd }: AddTodoProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TodoCategory>('personal');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      await createTodo(trimmed, description.trim(), category);
      setTitle('');
      setDescription('');
      setCategory('personal');
      onAdd();
    } catch (err) {
      alert(err instanceof Error ? err.message : '생성 실패');
    }
  }

  return (
    <form className="add-todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        className="input-field"
        placeholder="새로운 할 일..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        autoFocus
      />
      <input
        type="text"
        className="input-field input-desc"
        placeholder="설명 (선택)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
      />
      <div className="category-select">
        {CATEGORY_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            className={`category-chip ${category === key ? 'selected' : ''}`}
            style={{
              '--chip-color': CATEGORIES[key].color,
            } as React.CSSProperties}
            onClick={() => setCategory(key)}
          >
            {CATEGORIES[key].icon} {CATEGORIES[key].label}
          </button>
        ))}
      </div>
      <button type="submit" className="submit-btn">
        추가하기
      </button>
    </form>
  );
}
