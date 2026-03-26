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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          className="btn-icon btn-back"
          onClick={() => router.push('/chat')}
          aria-label="뒤로가기"
        >
          ←
        </button>
        <div className="chat-header-info">
          <h3>{roomName}</h3>
        </div>
      </div>
      <div className="online-count">
        <span className="online-dot" />
        {onlineCount}명 접속 중
      </div>
    </div>
  );
}
