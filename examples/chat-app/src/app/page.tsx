'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  users,
  rooms as mockRooms,
  messages as mockMessages,
  CURRENT_USER_ID,
} from '@/data/mock';
import { ChatRoom, Message } from '@/data/types';
import Sidebar from '@/components/Sidebar';
import SearchBar from '@/components/SearchBar';
import OnlineAvatars from '@/components/OnlineAvatars';
import ChatList from '@/components/ChatList';
import ChatView from '@/components/ChatView';
import ProfilePanel from '@/components/ProfilePanel';
import CreateRoomModal from '@/components/CreateRoomModal';

export default function Home() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenu, setActiveMenu] = useState('chats');

  // 가변 상태: 채팅방 목록과 메시지 (목 데이터를 복사하여 수정 가능하게)
  const [rooms, setRooms] = useState<ChatRoom[]>(() => [...mockRooms]);
  const [allMessages, setAllMessages] = useState<Record<string, Message[]>>(
    () => JSON.parse(JSON.stringify(mockMessages))
  );

  // 선택된 채팅방
  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? null,
    [selectedRoomId, rooms]
  );

  // 선택된 채팅방의 메시지
  const currentMessages = useMemo(
    () => (selectedRoomId ? allMessages[selectedRoomId] ?? [] : []),
    [selectedRoomId, allMessages]
  );

  // 전체 안읽은 메시지 수
  const totalUnread = useMemo(
    () => rooms.reduce((sum, r) => sum + r.unreadCount, 0),
    [rooms]
  );

  // 기능 1: 대화 선택 + 읽음 처리
  const handleSelectRoom = useCallback((roomId: string) => {
    setSelectedRoomId(roomId);
    setShowProfile(true);
    // 읽음 처리: unreadCount를 0으로
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))
    );
  }, []);

  // 뒤로가기 핸들러
  const handleBack = useCallback(() => {
    setSelectedRoomId(null);
    setShowProfile(false);
  }, []);

  // 프로필 패널 토글
  const handleSelectUser = useCallback(() => {
    setShowProfile(true);
  }, []);

  // 기능 2: 메시지 전송
  const handleSendMessage = useCallback(
    (content: string) => {
      if (!selectedRoomId || !content.trim()) return;

      const now = new Date();
      const timeStr = now.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        content: content.trim(),
        senderId: CURRENT_USER_ID,
        timestamp: timeStr,
      };

      // 메시지 추가
      setAllMessages((prev) => ({
        ...prev,
        [selectedRoomId]: [...(prev[selectedRoomId] ?? []), newMessage],
      }));

      // 채팅방의 lastMessage 업데이트
      setRooms((prev) =>
        prev.map((r) =>
          r.id === selectedRoomId
            ? { ...r, lastMessage: content.trim(), lastMessageTime: timeStr }
            : r
        )
      );
    },
    [selectedRoomId]
  );

  // 기능 3: 온라인 아바타 클릭 → 해당 사용자와의 1:1 대화 열기
  const handleSelectOnlineUser = useCallback(
    (userId: string) => {
      // 해당 사용자와의 1:1 채팅방 찾기
      const existingRoom = rooms.find(
        (r) =>
          r.members.length === 2 &&
          r.members.some((m) => m.id === userId) &&
          r.members.some((m) => m.id === CURRENT_USER_ID)
      );

      if (existingRoom) {
        handleSelectRoom(existingRoom.id);
      } else {
        // 없으면 새 1:1 채팅방 생성
        const user = users.find((u) => u.id === userId);
        if (!user) return;

        const newRoomId = `r-${Date.now()}`;
        const newRoom: ChatRoom = {
          id: newRoomId,
          name: user.nickname,
          lastMessage: '',
          lastMessageTime: '지금',
          unreadCount: 0,
          members: [
            user,
            { id: CURRENT_USER_ID, nickname: '나', online: true },
          ],
        };

        setRooms((prev) => [newRoom, ...prev]);
        setAllMessages((prev) => ({ ...prev, [newRoomId]: [] }));
        setSelectedRoomId(newRoomId);
        setShowProfile(true);
      }
    },
    [rooms, handleSelectRoom]
  );

  // 기능 4: 채팅방 새로 만들기
  const handleCreateRoom = useCallback((name: string) => {
    const newRoomId = `r-${Date.now()}`;
    const newRoom: ChatRoom = {
      id: newRoomId,
      name,
      lastMessage: '',
      lastMessageTime: '지금',
      unreadCount: 0,
      members: [{ id: CURRENT_USER_ID, nickname: '나', online: true }],
    };

    setRooms((prev) => [newRoom, ...prev]);
    setAllMessages((prev) => ({ ...prev, [newRoomId]: [] }));
    setShowCreateRoom(false);
    setSelectedRoomId(newRoomId);
    setShowProfile(false);
  }, []);

  return (
    <div className="flex h-full gap-3 p-3">
      {/* 좌측 사이드바 */}
      <Sidebar
        totalUnread={totalUnread}
        activeMenu={activeMenu}
        onMenuSelect={setActiveMenu}
        onCreateRoom={() => setShowCreateRoom(true)}
      />

      {/* 중앙 패널 */}
      <div className="flex-1 glass-panel rounded-2xl flex flex-col min-w-0 overflow-hidden">
        {selectedRoom ? (
          <ChatView
            room={selectedRoom}
            messages={currentMessages}
            users={users}
            onBack={handleBack}
            onSelectUser={handleSelectUser}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <OnlineAvatars
              users={users}
              onSelectUser={handleSelectOnlineUser}
            />
            <div className="mx-4 border-t border-border-subtle" />
            <ChatList
              rooms={rooms}
              selectedRoomId={selectedRoomId}
              searchQuery={searchQuery}
              onSelectRoom={handleSelectRoom}
            />
          </>
        )}
      </div>

      {/* 우측 프로필 패널 */}
      {selectedRoom && showProfile && (
        <ProfilePanel
          room={selectedRoom}
          onClose={() => setShowProfile(false)}
        />
      )}

      {/* 채팅방 생성 모달 */}
      {showCreateRoom && (
        <CreateRoomModal
          onClose={() => setShowCreateRoom(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}
