'use client';

import type { Todo } from '@/lib/types';
import { updateTodo, deleteTodo } from '@/lib/api-client';

interface TodoItemProps {
  todo: Todo;
  onChange: () => void;
}

export function TodoItem({ todo, onChange }: TodoItemProps) {
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
      <label className="todo-checkbox">
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={handleToggle}
        />
        <span className="todo-title">{todo.title}</span>
      </label>
      {todo.description && <p className="todo-desc">{todo.description}</p>}
      <button className="delete-btn" onClick={handleDelete} aria-label="삭제">
        ✕
      </button>
    </li>
  );
}
