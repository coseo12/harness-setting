import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TodoList } from '@/components/TodoList';
import type { Todo } from '@/lib/types';

global.fetch = vi.fn();

const mockTodos: Todo[] = [
  {
    id: '1',
    title: '첫 번째',
    description: '',
    completed: false,
    category: 'personal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: '두 번째',
    description: '설명 있음',
    completed: true,
    category: 'work',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
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

  it('할 일 개수만큼 삭제 버튼 렌더링', () => {
    render(<TodoList todos={mockTodos} onChange={vi.fn()} />);
    const items = screen.getAllByLabelText('삭제');
    expect(items).toHaveLength(2);
  });
});
