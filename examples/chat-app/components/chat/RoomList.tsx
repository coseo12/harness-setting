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
        <span>💬</span>
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
