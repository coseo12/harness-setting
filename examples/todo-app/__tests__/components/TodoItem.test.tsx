import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TodoItem } from '@/components/TodoItem';
import type { Todo } from '@/lib/types';

const mockFetch = vi.fn();
global.fetch = mockFetch;

const baseTodo: Todo = {
  id: 'test-1',
  title: '테스트 할 일',
  description: '설명',
  completed: false,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('TodoItem', () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ todo: { ...baseTodo, completed: true } }),
    });
  });

  it('제목과 설명이 렌더링됨', () => {
    render(<TodoItem todo={baseTodo} onChange={onChange} />);
    expect(screen.getByText('테스트 할 일')).toBeInTheDocument();
    expect(screen.getByText('설명')).toBeInTheDocument();
  });

  it('완료 상태이면 completed 클래스 적용', () => {
    const completedTodo = { ...baseTodo, completed: true };
    render(<TodoItem todo={completedTodo} onChange={onChange} />);
    const li = screen.getByText('테스트 할 일').closest('li');
    expect(li).toHaveClass('completed');
  });

  it('체크박스 클릭 시 PATCH API 호출', async () => {
    render(<TodoItem todo={baseTodo} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/test-1',
        expect.objectContaining({ method: 'PATCH' }),
      );
      expect(onChange).toHaveBeenCalled();
    });
  });

  it('삭제 버튼 클릭 시 DELETE API 호출', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    render(<TodoItem todo={baseTodo} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('삭제'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/todos/test-1',
        expect.objectContaining({ method: 'DELETE' }),
      );
      expect(onChange).toHaveBeenCalled();
    });
  });
});
