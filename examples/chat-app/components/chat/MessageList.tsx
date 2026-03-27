'use client';

import { useEffect, useRef } from 'react';
import type { Message } from '@/lib/types';
import MessageBubble from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  hasMore: boolean;
  onLoadMore: () => void;
}

export default function MessageList({
  messages,
  currentUserId,
  hasMore,
  onLoadMore,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // 새 메시지 추가 시 자동 스크롤
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p>첫 메시지를 보내보세요!</p>
      </div>
    );
  }

  // 메시지는 DB에서 desc로 오지만, 화면에는 오래된 것부터 표시
  const sorted = [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="message-list">
      {hasMore && (
        <div className="load-more">
          <button className="btn-load-more" onClick={onLoadMore}>
            이전 메시지 불러오기
          </button>
        </div>
      )}
      {sorted.map((msg, i) => {
        const prevMsg = sorted[i - 1];
        const showSender = !prevMsg || prevMsg.userId !== msg.userId;

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.userId === currentUserId}
            showSender={showSender}
          />
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
