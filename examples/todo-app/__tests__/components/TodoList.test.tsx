import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TodoList } from '@/components/TodoList';
import type { Todo } from '@/lib/types';

// TodoItem이 fetch를 호출하므로 mock 필요
global.fetch = vi.fn();

const mockTodos: Todo[] = [
  {
    id: '1',
    title: '첫 번째',
    description: '',
    completed: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: '두 번째',
    description: '설명 있음',
    completed: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('TodoList', () => {
  it('빈 목록일 때 메시지 표시', () => {
    render(<TodoList todos={[]} onChange={vi.fn()} />);
    expect(screen.getByText('할 일이 없습니다.')).toBeInTheDocument();
  });

  it('할 일 목록 렌더링', () => {
    render(<TodoList todos={mockTodos} onChange={vi.fn()} />);
    expect(screen.getByText('첫 번째')).toBeInTheDocument();
    expect(screen.getByText('두 번째')).toBeInTheDocument();
  });

  it('할 일 개수만큼 아이템 렌더링', () => {
    render(<TodoList todos={mockTodos} onChange={vi.fn()} />);
    const items = screen.getAllByRole('checkbox');
    expect(items).toHaveLength(2);
  });
});
