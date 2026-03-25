'use client';

import type { Todo } from '@/lib/types';
import { TodoItem } from './TodoItem';

interface TodoListProps {
  todos: Todo[];
  onChange: () => void;
}

export function TodoList({ todos, onChange }: TodoListProps) {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">{'📝'}</span>
        <p className="empty-message">할 일이 없습니다.</p>
        <p className="empty-sub">위의 ＋ 버튼으로 새 할 일을 추가하세요</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} onChange={onChange} />
      ))}
    </ul>
  );
}
