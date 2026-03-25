import type { Todo, TodoFilter, TodoListResponse, TodoResponse } from './types';

export async function fetchTodos(filter: TodoFilter = ''): Promise<Todo[]> {
  const query = filter ? `?filter=${filter}` : '';
  const res = await fetch(`/api/todos${query}`);
  if (!res.ok) throw new Error('목록 조회 실패');
  const data: TodoListResponse = await res.json();
  return data.todos;
}

export async function createTodo(title: string, description = ''): Promise<Todo> {
  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || '생성 실패');
  }
  const data: TodoResponse = await res.json();
  return data.todo;
}

export async function updateTodo(
  id: string,
  updates: Partial<Pick<Todo, 'title' | 'description' | 'completed'>>,
): Promise<Todo> {
  const res = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('수정 실패');
  const data: TodoResponse = await res.json();
  return data.todo;
}

export async function deleteTodo(id: string): Promise<void> {
  const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('삭제 실패');
}
