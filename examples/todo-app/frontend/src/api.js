/**
 * To-Do API 클라이언트
 * MOCK_MODE=true 시 로컬 배열로 동작 (BE 미완료 시 FE 독립 개발용)
 */

const MOCK_MODE = false;
let mockTodos = [];
let mockIdCounter = 1;

// Mock 헬퍼
function mockResponse(data, delay = 100) {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

function generateMockTodo(title, description = '') {
  const now = new Date().toISOString();
  return {
    id: String(mockIdCounter++),
    title,
    description,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
}

// API 함수
export async function fetchTodos(filter = '') {
  if (MOCK_MODE) {
    let todos = [...mockTodos];
    if (filter === 'completed') todos = todos.filter((t) => t.completed);
    if (filter === 'active') todos = todos.filter((t) => !t.completed);
    return mockResponse({ todos });
  }

  const query = filter ? `?filter=${filter}` : '';
  const res = await fetch(`/api/todos${query}`);
  if (!res.ok) throw new Error('목록 조회 실패');
  return res.json();
}

export async function createTodo(title, description = '') {
  if (MOCK_MODE) {
    const todo = generateMockTodo(title, description);
    mockTodos.push(todo);
    return mockResponse({ todo });
  }

  const res = await fetch('/api/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || '생성 실패');
  }
  return res.json();
}

export async function updateTodo(id, updates) {
  if (MOCK_MODE) {
    const todo = mockTodos.find((t) => t.id === id);
    if (!todo) throw new Error('할 일을 찾을 수 없습니다.');
    Object.assign(todo, updates, { updatedAt: new Date().toISOString() });
    return mockResponse({ todo });
  }

  const res = await fetch(`/api/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('수정 실패');
  return res.json();
}

export async function deleteTodo(id) {
  if (MOCK_MODE) {
    mockTodos = mockTodos.filter((t) => t.id !== id);
    return mockResponse({ success: true });
  }

  const res = await fetch(`/api/todos/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('삭제 실패');
  return res.json();
}
