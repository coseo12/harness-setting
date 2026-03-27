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
  const [activeMenu, setActiveMenu] = useState('chat');

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
        onMenuSelect={(menu) => {
          setActiveMenu(menu);
          setSelectedRoomId(null);
          setShowProfile(false);
        }}
        onCreateRoom={() => setShowCreateRoom(true)}
        onSelectCommunity={(name) => {
          setActiveMenu(`community:${name}`);
          setSelectedRoomId(null);
          setShowProfile(false);
        }}
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
        ) : activeMenu === 'chat' ? (
          /* Chats 메뉴: 대화 목록 */
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
        ) : activeMenu === 'shop' ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">Marketplace</h2>
            <p className="text-sm text-text-muted max-w-xs">
              친구들이 판매 중인 아이템을 둘러보세요. 중고 거래, 핸드메이드 제품 등 다양한 아이템을 만날 수 있습니다.
            </p>
            <p className="text-xs text-text-muted mt-6">준비 중입니다</p>
          </div>
        ) : activeMenu === 'request' ? (
          /* Message requests 메뉴 */
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">메시지 요청</h2>
            <p className="text-sm text-text-muted max-w-xs">
              아직 수락하지 않은 메시지 요청이 여기에 표시됩니다. 모르는 사람의 메시지를 검토할 수 있습니다.
            </p>
            <p className="text-xs text-text-muted mt-6">요청이 없습니다</p>
          </div>
        ) : activeMenu === 'archive' ? (
          /* Archive 메뉴 */
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-text-primary mb-2">보관함</h2>
            <p className="text-sm text-text-muted max-w-xs">
              보관된 대화가 여기에 표시됩니다. 보관된 대화는 목록에서 숨겨지지만 언제든 다시 열 수 있습니다.
            </p>
            <p className="text-xs text-text-muted mt-6">보관된 대화가 없습니다</p>
          </div>
        ) : activeMenu.startsWith('community:') ? (
          /* 커뮤니티 상세 뷰 */
          <div className="flex-1 flex flex-col">
            {/* 커뮤니티 헤더 */}
            <div className="px-6 py-4 border-b border-border-subtle flex items-center gap-3">
              <button
                onClick={() => setActiveMenu('chat')}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="w-10 h-10 rounded-xl bg-accent-blue/20 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-text-primary">{activeMenu.replace('community:', '')}</h3>
                <p className="text-xs text-text-muted">커뮤니티</p>
              </div>
            </div>

            {/* 커뮤니티 콘텐츠 */}
            <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
              <div className="w-20 h-20 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-5">
                <svg className="w-10 h-10 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">{activeMenu.replace('community:', '')}</h2>
              <p className="text-sm text-text-muted max-w-sm mb-6">
                커뮤니티 멤버들과 소통하고, 최신 소식을 확인하세요. 관심사를 공유하는 사람들과 함께합니다.
              </p>
              <div className="flex gap-6 text-center">
                <div>
                  <p className="text-2xl font-bold text-accent-blue">
                    {activeMenu.includes('UI/UX') ? '2,922' : '1,458'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Active</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-text-primary">
                    {activeMenu.includes('UI/UX') ? '12,847' : '5,231'}
                  </p>
                  <p className="text-xs text-text-muted mt-1">Members</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
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
