import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AddTodo } from '@/components/AddTodo';

// fetch mock
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AddTodo', () => {
  const onAdd = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        todo: { id: '1', title: '새 할 일', description: '', completed: false, createdAt: '', updatedAt: '' },
      }),
    });
  });

  it('입력 필드와 버튼이 렌더링됨', () => {
    render(<AddTodo onAdd={onAdd} />);
    expect(screen.getByPlaceholderText('할 일을 입력하세요')).toBeInTheDocument();
    expect(screen.getByText('추가')).toBeInTheDocument();
  });

  it('제출 후 입력 필드가 초기화됨', async () => {
    render(<AddTodo onAdd={onAdd} />);
    const input = screen.getByPlaceholderText('할 일을 입력하세요');

    fireEvent.change(input, { target: { value: '새 할 일' } });
    fireEvent.submit(screen.getByText('추가').closest('form')!);

    await waitFor(() => {
      expect(onAdd).toHaveBeenCalled();
      expect(input).toHaveValue('');
    });
  });

  it('API 호출 시 올바른 body 전달', async () => {
    render(<AddTodo onAdd={onAdd} />);

    fireEvent.change(screen.getByPlaceholderText('할 일을 입력하세요'), {
      target: { value: '테스트' },
    });
    fireEvent.change(screen.getByPlaceholderText('설명 (선택)'), {
      target: { value: '설명 내용' },
    });
    fireEvent.submit(screen.getByText('추가').closest('form')!);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/todos', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ title: '테스트', description: '설명 내용' }),
      }));
    });
  });
});
