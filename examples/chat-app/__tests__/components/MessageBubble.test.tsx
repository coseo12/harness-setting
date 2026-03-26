import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MessageBubble from '@/components/chat/MessageBubble';
import type { Message } from '@/lib/types';

const baseMessage: Message = {
  id: '1',
  content: '안녕하세요!',
  userId: 'user1',
  roomId: 'room1',
  createdAt: '2026-01-01T12:00:00Z',
  user: { id: 'user1', nickname: '테스터', avatar: null, createdAt: '' },
};

describe('MessageBubble', () => {
  it('보낸 메시지에 mine 스타일을 적용한다', () => {
    const { container } = render(<MessageBubble message={baseMessage} isMine={true} />);
    expect(container.querySelector('.message-group.mine')).toBeInTheDocument();
    expect(container.querySelector('.message-bubble.mine')).toBeInTheDocument();
    expect(screen.getByText('안녕하세요!')).toBeInTheDocument();
  });

  it('받은 메시지에 other 스타일과 닉네임을 표시한다', () => {
    const { container } = render(
      <MessageBubble message={baseMessage} isMine={false} showSender={true} />,
    );
    expect(container.querySelector('.message-group.other')).toBeInTheDocument();
    expect(screen.getByText('테스터')).toBeInTheDocument();
  });
});
