'use client';

interface ChatHeaderProps {
  roomName: string;
  onlineCount: number;
}

export default function ChatHeader({ roomName, onlineCount }: ChatHeaderProps) {
  return (
    <div className="chat-header">
      <div className="chat-header-info">
        <h3>{roomName}</h3>
      </div>
      <div className="online-count">
        <span className="online-dot" />
        {onlineCount}명 접속 중
      </div>
    </div>
  );
}
