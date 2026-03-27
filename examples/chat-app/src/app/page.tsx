'use client';

import { useState, useMemo } from 'react';
import {
  users,
  rooms as mockRooms,
  messages as mockMessages,
} from '@/data/mock';
import Sidebar from '@/components/Sidebar';
import SearchBar from '@/components/SearchBar';
import OnlineAvatars from '@/components/OnlineAvatars';
import ChatList from '@/components/ChatList';
import ChatView from '@/components/ChatView';
import ProfilePanel from '@/components/ProfilePanel';

export default function Home() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 선택된 채팅방
  const selectedRoom = useMemo(
    () => mockRooms.find((r) => r.id === selectedRoomId) ?? null,
    [selectedRoomId]
  );

  // 선택된 채팅방의 메시지
  const currentMessages = useMemo(
    () => (selectedRoomId ? mockMessages[selectedRoomId] ?? [] : []),
    [selectedRoomId]
  );

  // 전체 안읽은 메시지 수
  const totalUnread = useMemo(
    () => mockRooms.reduce((sum, r) => sum + r.unreadCount, 0),
    []
  );

  // 대화 선택 핸들러
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    setShowProfile(true);
  };

  // 뒤로가기 핸들러
  const handleBack = () => {
    setSelectedRoomId(null);
    setShowProfile(false);
  };

  // 프로필 패널에 사용자 표시
  const handleSelectUser = () => {
    setShowProfile(true);
  };

  return (
    <div className="flex h-full gap-3 p-3">
      {/* 좌측 사이드바 */}
      <Sidebar totalUnread={totalUnread} />

      {/* 중앙 패널 */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col min-w-0 overflow-hidden">
        {selectedRoom ? (
          /* 대화 선택됨: 메시지 뷰 */
          <ChatView
            room={selectedRoom}
            messages={currentMessages}
            users={users}
            onBack={handleBack}
            onSelectUser={handleSelectUser}
          />
        ) : (
          /* 대화 미선택: 대화 목록 */
          <>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <OnlineAvatars users={users} />
            <div className="mx-4 border-t border-border-subtle" />
            <ChatList
              rooms={mockRooms}
              selectedRoomId={selectedRoomId}
              searchQuery={searchQuery}
              onSelectRoom={handleSelectRoom}
            />
          </>
        )}
      </div>

      {/* 우측 프로필 패널 (대화 선택 시 표시) */}
      {selectedRoom && showProfile && (
        <ProfilePanel
          room={selectedRoom}
          onClose={() => setShowProfile(false)}
        />
      )}
    </div>
  );
}
