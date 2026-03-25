'use client';

import type { Todo } from '@/lib/types';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onChange: () => void;
}

export function TodoList({ todos, onChange }: TodoListProps) {
  if (todos.length === 0) {
    return <p className="empty-message">할 일이 없습니다.</p>;
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onChange={onChange} />
      ))}
    </ul>
  );
}
