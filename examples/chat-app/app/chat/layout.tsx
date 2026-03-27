'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { fetchRooms, createRoom as apiCreateRoom } from '@/lib/api-client';
import type { Room } from '@/lib/types';
import RoomList from '@/components/chat/RoomList';
import CreateRoomModal from '@/components/chat/CreateRoomModal';
import Avatar from '@/components/ui/Avatar';

function ChatLayoutInner({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 모바일: 채팅방 진입 시 사이드바 숨김
  const isInRoom = pathname !== '/chat' && pathname.startsWith('/chat/');

  // 현재 활성 채팅방 ID 추출
  const activeRoomId = isInRoom ? pathname.split('/chat/')[1] : undefined;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  // 모바일에서 채팅방 진입 시 사이드바 닫기
  useEffect(() => {
    if (isInRoom && window.innerWidth < 769) {
      setSidebarOpen(false);
    }
  }, [isInRoom]);

  // 채팅방 목록 로드
  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const data = await fetchRooms();
        setRooms(data.rooms);
      } catch {
        // 에러 시 빈 목록 유지
      }
    }

    load();
    // 10초마다 갱신
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [user]);

  async function handleCreateRoom(name: string) {
    const data = await apiCreateRoom(name);
    setRooms((prev) => [data.room, ...prev]);
    router.push(`/chat/${data.room.id}`);
  }

  function handleLogout() {
    logout();
    router.replace('/');
  }

  if (loading || !user) return null;

  return (
    <div className="chat-layout">
      {/* 모바일 햄버거 버튼 */}
      {!sidebarOpen && (
        <button
          className="btn-hamburger"
          onClick={() => setSidebarOpen(true)}
          aria-label="메뉴 열기"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* 좌측 사이드바 (300px) */}
      <aside className={`chat-sidebar ${!sidebarOpen ? 'sidebar-hidden' : ''}`}>
        {/* 프로필 영역 */}
        <div className="sidebar-profile">
          <Avatar nickname={user.nickname} size="md" online />
          <div className="sidebar-profile-info">
            <div className="sidebar-profile-name">{user.nickname}</div>
            <div className="sidebar-profile-status">온라인</div>
          </div>
          <button className="btn-icon" aria-label="설정">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>

        {/* Chats 헤더 + 새 채팅방 버튼 */}
        <div className="sidebar-section-header">
          <div className="sidebar-section-title">
            <span>Chats</span>
            {rooms.length > 0 && (
              <span className="badge-count">{rooms.length}</span>
            )}
          </div>
          <button className="btn-icon" onClick={() => setShowModal(true)} aria-label="새 채팅방">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>

        {/* 채팅방 목록 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          <RoomList rooms={rooms} activeRoomId={activeRoomId} />
        </div>

        {/* 하단: 로그아웃 */}
        <div className="sidebar-footer">
          <button className="btn-logout" onClick={handleLogout}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 중앙 + 우측 */}
      <main className="chat-main">
        {children}
      </main>

      {showModal && (
        <CreateRoomModal
          onClose={() => setShowModal(false)}
          onCreate={handleCreateRoom}
        />
      )}
    </div>
  );
}

export default function ChatLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ChatLayoutInner>{children}</ChatLayoutInner>
    </AuthProvider>
  );
}
