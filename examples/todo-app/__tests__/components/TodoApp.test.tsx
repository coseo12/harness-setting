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
    expect(screen.getByText('진행 중')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('카테고리 카드 4개 렌더링', () => {
    render(<TodoApp />);
    expect(screen.getByText('개인')).toBeInTheDocument();
    expect(screen.getByText('업무')).toBeInTheDocument();
    expect(screen.getByText('건강')).toBeInTheDocument();
    expect(screen.getByText('학습')).toBeInTheDocument();
  });

  it('진행률 카드 렌더링', () => {
    render(<TodoApp />);
    expect(screen.getByText('오늘의 진행률')).toBeInTheDocument();
  });
});
