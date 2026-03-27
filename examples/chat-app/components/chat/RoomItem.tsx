'use client';

import Link from 'next/link';
import type { Room } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface RoomItemProps {
  room: Room;
  active?: boolean;
}

// 최근 메시지 시간을 간략하게 표시
function formatTime(dateStr?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간`;
  const days = Math.floor(hours / 24);
  return `${days}일`;
}

export default function RoomItem({ room, active }: RoomItemProps) {
  const lastMessageText = room.lastMessage
    ? `${room.lastMessage.user?.nickname}: ${room.lastMessage.content}`
    : '아직 메시지가 없습니다';

  const timeStr = room.lastMessage
    ? formatTime(room.lastMessage.createdAt)
    : '';

  return (
    <Link href={`/chat/${room.id}`} className={`room-item ${active ? 'active' : ''}`}>
      <Avatar nickname={room.name} size="lg" />
      <div className="room-info">
        <div className="room-name">{room.name}</div>
        <div className="room-last-message">{lastMessageText}</div>
      </div>
      <div className="room-meta">
        {timeStr && <span className="room-time">{timeStr}</span>}
        {room.memberCount !== undefined && (
          <span className="room-member-count">{room.memberCount}명</span>
        )}
      </div>
    </Link>
  );
}
