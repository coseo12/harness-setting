'use client';

import type { Message } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  showSender?: boolean;
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

export default function MessageBubble({ message, isMine, showSender = true }: MessageBubbleProps) {
  const nickname = message.user?.nickname || '알 수 없음';

  return (
    <div className={`message-group ${isMine ? 'mine' : 'other'}`}>
      {/* 상대 메시지: 아바타 표시 (연속 메시지면 빈 공간) */}
      {!isMine && (
        <div className="message-avatar-col">
          {showSender && <Avatar nickname={nickname} size="sm" />}
        </div>
      )}
      <div className="message-content-col">
        {!isMine && showSender && (
          <span className="message-sender">{nickname}</span>
        )}
        <div className={`message-bubble ${isMine ? 'mine' : 'other'}`}>
          {message.content}
          <span className={`message-time-inline ${isMine ? 'mine' : 'other'}`}>
            {formatTime(message.createdAt)}
          </span>
        </div>
      </div>
    </div>
  );
}
