'use client';

import { useEffect, useState, use } from 'react';
import { fetchRoom } from '@/lib/api-client';
import ChatApp from '@/components/chat/ChatApp';

interface ChatRoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function ChatRoomPage({ params }: ChatRoomPageProps) {
  const { roomId } = use(params);
  const [roomName, setRoomName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchRoom(roomId);
        setRoomName(data.room.name);
      } catch (err) {
        setError(err instanceof Error ? err.message : '채팅방을 불러올 수 없습니다.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [roomId]);

  if (loading) {
    return (
      <div className="chat-empty">
        <p>채팅방을 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-empty">
        <span>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  return <ChatApp roomId={roomId} roomName={roomName} />;
}
