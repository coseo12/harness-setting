import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageInput from '@/components/chat/MessageInput';

describe('MessageInput', () => {
  it('입력 필드와 전송 버튼을 렌더링한다', () => {
    render(<MessageInput onSend={vi.fn()} />);
    expect(screen.getByPlaceholderText('메시지를 입력하세요...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '전송' })).toBeInTheDocument();
  });

  it('빈 입력은 전송하지 않는다', async () => {
    const onSend = vi.fn();
    render(<MessageInput onSend={onSend} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '전송' }));
    expect(onSend).not.toHaveBeenCalled();
  });
});
