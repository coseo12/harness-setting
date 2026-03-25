'use client';

import { useRef, useState, type FormEvent } from 'react';
import type { TodoCategory } from '@/lib/types';
import { createTodo } from '@/lib/api-client';
import { CATEGORIES, CATEGORY_KEYS } from '@/lib/categories';

interface AddTodoProps {
  onAdd: () => void;
}

export function AddTodo({ onAdd }: AddTodoProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [category, setCategory] = useState<TodoCategory>('personal');

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string)?.trim() ?? '';
    const description = (formData.get('description') as string)?.trim() ?? '';

    if (!title) return;

    try {
      await createTodo(title, description, category);
      formRef.current?.reset();
      setCategory('personal');
      onAdd();
    } catch (err) {
      alert(err instanceof Error ? err.message : '생성 실패');
    }
  }

  return (
    <form ref={formRef} className="add-todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        name="title"
        className="input-field"
        placeholder="새로운 할 일..."
        maxLength={200}
        autoFocus
      />
      <input
        type="text"
        name="description"
        className="input-field input-desc"
        placeholder="설명 (선택)"
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
