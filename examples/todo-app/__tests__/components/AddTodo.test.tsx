import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddTodo } from '@/components/AddTodo';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AddTodo', () => {
  const onAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        todo: { id: '1', title: '새 할 일', description: '', completed: false, category: 'personal', createdAt: '', updatedAt: '' },
      }),
    });
  });

  it('입력 필드와 버튼이 렌더링됨', () => {
    render(<AddTodo onAdd={onAdd} />);
    expect(screen.getByPlaceholderText('새로운 할 일...')).toBeInTheDocument();
    expect(screen.getByText('추가하기')).toBeInTheDocument();
  });

  it('제출 후 입력 필드가 초기화됨', async () => {
    render(<AddTodo onAdd={onAdd} />);
    const input = screen.getByPlaceholderText('새로운 할 일...');

    fireEvent.change(input, { target: { value: '새 할 일' } });
    fireEvent.submit(screen.getByText('추가하기').closest('form')!);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
      expect(input).toHaveValue('');
    });
  });

  it('카테고리 칩이 렌더링됨', () => {
    render(<AddTodo onAdd={onAdd} />);
    expect(screen.getByText(/개인/)).toBeInTheDocument();
    expect(screen.getByText(/업무/)).toBeInTheDocument();
    expect(screen.getByText(/건강/)).toBeInTheDocument();
    expect(screen.getByText(/학습/)).toBeInTheDocument();
  });
});
