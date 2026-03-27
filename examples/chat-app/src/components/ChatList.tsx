'use client';

import { ChatRoom } from '@/data/types';
import { CURRENT_USER_ID } from '@/data/mock';
import Avatar from './Avatar';

interface ChatListProps {
  rooms: ChatRoom[];
  selectedRoomId: string | null;
  searchQuery: string;
  onSelectRoom: (roomId: string) => void;
}

export default function ChatList({
  rooms,
  selectedRoomId,
  searchQuery,
  onSelectRoom,
}: ChatListProps) {
  // 검색어로 필터링
  const filtered = rooms.filter((room) =>
    room.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto">
      {filtered.map((room) => {
        const isSelected = room.id === selectedRoomId;
        // 1:1 대화에서 상대방 찾기
        const otherMember = room.members.find((m) => m.id !== CURRENT_USER_ID);
        const isGroup = room.members.length > 2;

        return (
          <button
            key={room.id}
            onClick={() => onSelectRoom(room.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left hover:bg-white/5 ${
              isSelected ? 'bg-white/8' : ''
            }`}
          >
            {/* 아바타 */}
            <Avatar
              src={isGroup ? undefined : otherMember?.avatar}
              nickname={room.name}
              size="md"
              online={isGroup ? undefined : otherMember?.online}
            />

            {/* 대화 정보 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary truncate">
                  {room.name}
                </span>
                <span className="text-[11px] text-text-muted shrink-0 ml-2">
                  {room.lastMessageTime}
                </span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-text-secondary truncate pr-2">
                  {room.lastMessage}
                </p>
                {room.unreadCount > 0 && (
                  <span className="shrink-0 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-accent-blue text-[10px] font-semibold text-white px-1">
                    {room.unreadCount}
                  </span>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {filtered.length === 0 && (
        <div className="px-4 py-8 text-center text-text-muted text-sm">
          검색 결과가 없습니다
        </div>
      )}
    </div>
  );
}
