import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TodoApp } from '@/components/TodoApp';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('TodoApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ todos: [] }),
    });
  });

  it('제목이 렌더링됨', async () => {
    render(<TodoApp />);
    expect(screen.getByText('할 일 목록')).toBeInTheDocument();
  });

  it('초기 로딩 시 API 호출', async () => {
    render(<TodoApp />);
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/todos');
    });
  });

  it('필터 버튼 3개 렌더링', () => {
    render(<TodoApp />);
    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('미완료')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('빈 목록 메시지 표시', async () => {
    render(<TodoApp />);
    await waitFor(() => {
      expect(screen.getByText('할 일이 없습니다.')).toBeInTheDocument();
    });
  });
});
