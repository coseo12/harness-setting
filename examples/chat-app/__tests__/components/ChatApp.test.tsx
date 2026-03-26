import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// ChatApp은 useSocket, useAuth, fetchMessages, useRouter를 사용하므로 mock 필요
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'u1', nickname: '테스터' }, token: 'tok', loading: false }),
}));

vi.mock('@/hooks/useSocket', () => ({
  useSocket: () => ({ sendMessage: vi.fn(), connected: true }),
}));

vi.mock('@/lib/api-client', () => ({
  fetchMessages: vi.fn().mockResolvedValue({ messages: [], nextCursor: null }),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => '/chat/r1',
}));

import ChatApp from '@/components/chat/ChatApp';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ChatApp', () => {
  it('방 이름을 헤더에 표시한다', async () => {
    render(<ChatApp roomId="r1" roomName="테스트 채팅방" />);
    // 메시지 로딩 후 헤더 표시
    expect(await screen.findByText('테스트 채팅방')).toBeInTheDocument();
  });

  it('메시지가 없으면 안내 문구를 표시한다', async () => {
    render(<ChatApp roomId="r1" roomName="빈 방" />);
    expect(await screen.findByText('첫 메시지를 보내보세요!')).toBeInTheDocument();
  });
});
