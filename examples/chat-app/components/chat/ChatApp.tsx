'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { fetchMessages } from '@/lib/api-client';
import type { Message, PublicUser } from '@/lib/types';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import OnlineUsers from './OnlineUsers';
import Avatar from '@/components/ui/Avatar';

interface ChatAppProps {
  roomId: string;
  roomName: string;
}

export default function ChatApp({ roomId, roomName }: ChatAppProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<PublicUser[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Socket.IO 연결
  const { sendMessage, connected } = useSocket({
    roomId,
    onNewMessage: useCallback((msg: Message) => {
      setMessages((prev) => [...prev, msg]);
    }, []),
    onOnlineUsers: useCallback((users: PublicUser[]) => {
      setOnlineUsers(users);
    }, []),
    onUserJoined: useCallback((joinedUser: PublicUser) => {
      setOnlineUsers((prev) => {
        if (prev.find((u) => u.id === joinedUser.id)) return prev;
        return [...prev, joinedUser];
      });
    }, []),
    onUserLeft: useCallback((userId: string) => {
      setOnlineUsers((prev) => prev.filter((u) => u.id !== userId));
    }, []),
  });

  // 초기 메시지 로드
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchMessages(roomId);
        if (!cancelled) {
          setMessages(data.messages);
          setNextCursor(data.nextCursor);
        }
      } catch {
        // 에러 시 빈 상태 유지
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [roomId]);

  // 이전 메시지 더 불러오기
  async function loadMore() {
    if (!nextCursor) return;
    const data = await fetchMessages(roomId, nextCursor);
    setMessages((prev) => [...data.messages, ...prev]);
    setNextCursor(data.nextCursor);
  }

  function handleSend(content: string) {
    sendMessage(content);
  }

  if (loading) {
    return (
      <div className="chat-empty">
        <p>메시지를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
      {/* 메인 채팅 영역 */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
        <ChatHeader roomName={roomName} onlineCount={onlineUsers.length} />
        <OnlineUsers users={onlineUsers} />
        <MessageList
          messages={messages}
          currentUserId={user?.id || ''}
          hasMore={!!nextCursor}
          onLoadMore={loadMore}
        />
        <MessageInput onSend={handleSend} disabled={!connected} />
      </div>

      {/* 우측 패널 (lg 이상에서만 표시) */}
      <aside className="chat-right-panel">
        <div className="right-panel-header">
          <Avatar nickname={roomName} size="xl" />
          <h3>{roomName}</h3>
          <p>{onlineUsers.length}명 접속 중</p>
        </div>
        <div className="right-panel-list">
          <div className="right-panel-list-title">참여자</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {onlineUsers.map((u) => (
              <div key={u.id} className="right-panel-user">
                <Avatar nickname={u.nickname} size="sm" online />
                <span>{u.nickname}</span>
              </div>
            ))}
          </div>
          {onlineUsers.length === 0 && (
            <p className="right-panel-empty">접속 중인 사용자 없음</p>
          )}
        </div>
      </aside>
    </div>
  );
}
