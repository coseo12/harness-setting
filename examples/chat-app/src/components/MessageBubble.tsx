'use client';

import { Message, User } from '@/data/types';
import Avatar from './Avatar';

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  sender?: User;
}

export default function MessageBubble({
  message,
  isMine,
  sender,
}: MessageBubbleProps) {
  if (isMine) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[70%]">
          <div className="msg-gradient text-white px-4 py-2.5 rounded-2xl rounded-br-sm">
            <p className="text-sm leading-relaxed">{message.content}</p>
            <span className="block text-[10px] text-white/60 text-right mt-1">
              {message.timestamp}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 mb-3">
      {/* 상대 아바타 */}
      <div className="shrink-0 self-end">
        <Avatar
          src={sender?.avatar}
          nickname={sender?.nickname ?? '?'}
          size="sm"
        />
      </div>
      <div className="max-w-[70%]">
        <div className="bg-bg-card border border-border-subtle text-text-primary px-4 py-2.5 rounded-2xl rounded-bl-sm">
          <p className="text-sm leading-relaxed">{message.content}</p>
          <span className="block text-[10px] text-text-muted text-right mt-1">
            {message.timestamp}
          </span>
        </div>
      </div>
    </div>
  );
}
