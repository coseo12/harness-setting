import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import RoomList from '@/components/chat/RoomList';
import type { Room } from '@/lib/types';

const mockRooms: Room[] = [
  { id: '1', name: '일반 채팅방', createdAt: '2026-01-01', memberCount: 3, lastMessage: null },
  { id: '2', name: '개발 토론', createdAt: '2026-01-02', memberCount: 5, lastMessage: null },
];

describe('RoomList', () => {
  it('채팅방 목록을 렌더링한다', () => {
    render(<RoomList rooms={mockRooms} />);
    expect(screen.getByText('일반 채팅방')).toBeInTheDocument();
    expect(screen.getByText('개발 토론')).toBeInTheDocument();
  });

  it('빈 목록일 때 안내 메시지를 표시한다', () => {
    render(<RoomList rooms={[]} />);
    expect(screen.getByText('아직 채팅방이 없습니다')).toBeInTheDocument();
  });
});
