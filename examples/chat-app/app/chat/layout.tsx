'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
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
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

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
    router.replace('/login');
  }

  if (loading || !user) return null;

  return (
    <div className="chat-layout">
      <aside className="chat-sidebar">
        <div className="sidebar-header">
          <h2 className="gradient-text">ChatApp</h2>
          <button className="btn-icon" onClick={() => setShowModal(true)} aria-label="새 채팅방">
            +
          </button>
        </div>
        <div className="sidebar-user">
          <Avatar nickname={user.nickname} online />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user.nickname}</div>
            <div className="sidebar-user-email">{user.email}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} aria-label="로그아웃">
            ⏻
          </button>
        </div>
        <RoomList rooms={rooms} />
      </aside>
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
