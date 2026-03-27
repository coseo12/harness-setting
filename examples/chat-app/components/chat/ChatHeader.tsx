'use client';

import { useRouter } from 'next/navigation';

interface ChatHeaderProps {
  roomName: string;
  onlineCount: number;
}

export default function ChatHeader({ roomName, onlineCount }: ChatHeaderProps) {
  const router = useRouter();

  return (
    <div className="chat-header">
      <div className="chat-header-left">
        {/* 모바일 뒤로가기 */}
        <button
          className="btn-icon btn-back"
          onClick={() => router.push('/chat')}
          aria-label="뒤로가기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div className="chat-header-info">
          <h3>{roomName}</h3>
          <div className="chat-header-status">
            <span className="online-dot" />
            <span>{onlineCount}명 접속 중</span>
          </div>
        </div>
      </div>
      <div className="chat-header-right">
        {/* 검색 아이콘 */}
        <button className="btn-icon" aria-label="검색">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
        {/* 더보기 아이콘 */}
        <button className="btn-icon" aria-label="더보기">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="19" r="1" />
          </svg>
        </button>
      </div>
    </div>
  );
}
