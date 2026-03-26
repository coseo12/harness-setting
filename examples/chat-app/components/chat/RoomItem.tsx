'use client';

import Link from 'next/link';
import type { Room } from '@/lib/types';

interface RoomItemProps {
  room: Room;
  active?: boolean;
}

// 방 이름 첫 글자로 아이콘 생성
function getRoomEmoji(name: string): string {
  const first = name.charAt(0);
  if (/[가-힣]/.test(first)) return first;
  return '#';
}

export default function RoomItem({ room, active }: RoomItemProps) {
  return (
    <Link href={`/chat/${room.id}`} className={`room-item ${active ? 'active' : ''}`}>
      <div className="room-icon">{getRoomEmoji(room.name)}</div>
      <div className="room-info">
        <div className="room-name">{room.name}</div>
        <div className="room-last-message">
          {room.lastMessage
            ? `${room.lastMessage.user?.nickname}: ${room.lastMessage.content}`
            : '아직 메시지가 없습니다'}
        </div>
      </div>
      <div className="room-meta">
        {room.memberCount !== undefined && (
          <span className="room-member-count">{room.memberCount}명</span>
        )}
      </div>
    </Link>
  );
}
