'use client';

import type { Room } from '@/lib/types';
import RoomItem from './RoomItem';

interface RoomListProps {
  rooms: Room[];
  activeRoomId?: string;
}

export default function RoomList({ rooms, activeRoomId }: RoomListProps) {
  if (rooms.length === 0) {
    return (
      <div className="room-list-empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <p>아직 채팅방이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="room-list">
      {rooms.map((room) => (
        <RoomItem key={room.id} room={room} active={room.id === activeRoomId} />
      ))}
    </div>
  );
}
