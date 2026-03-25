'use client';

import { useState, type FormEvent } from 'react';
import { createTodo } from '@/lib/api-client';

interface AddTodoProps {
  onAdd: () => void;
}

export function AddTodo({ onAdd }: AddTodoProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;

    try {
      await createTodo(trimmed, description.trim());
      setTitle('');
      setDescription('');
      onAdd();
    } catch (err) {
      alert(err instanceof Error ? err.message : '생성 실패');
    }
  }

  return (
    <form className="add-todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="할 일을 입력하세요"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
        required
      />
      <input
        type="text"
        placeholder="설명 (선택)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        maxLength={1000}
      />
      <button type="submit">추가</button>
    </form>
  );
}
