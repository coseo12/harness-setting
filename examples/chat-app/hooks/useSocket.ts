'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type { Message, PublicUser } from '@/lib/types';
import type { Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents } from '@/lib/types';

interface UseSocketOptions {
  roomId: string;
  onNewMessage: (message: Message) => void;
  onOnlineUsers: (users: PublicUser[]) => void;
  onUserJoined: (user: PublicUser) => void;
  onUserLeft: (userId: string) => void;
}

export function useSocket({
  roomId,
  onNewMessage,
  onOnlineUsers,
  onUserJoined,
  onUserLeft,
}: UseSocketOptions) {
  const { token } = useAuth();
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token || !roomId) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-room', { roomId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('new-message', onNewMessage);
    socket.on('online-users', (data) => onOnlineUsers(data.users));
    socket.on('user-joined', (data) => onUserJoined(data.user));
    socket.on('user-left', (data) => onUserLeft(data.userId));

    // 이미 연결된 상태라면 방 입장
    if (socket.connected) {
      setConnected(true);
      socket.emit('join-room', { roomId });
    }

    return () => {
      socket.emit('leave-room', { roomId });
      socket.off('new-message', onNewMessage);
      socket.off('online-users');
      socket.off('user-joined');
      socket.off('user-left');
      socket.off('connect');
      socket.off('disconnect');
      disconnectSocket();
    };
  }, [token, roomId, onNewMessage, onOnlineUsers, onUserJoined, onUserLeft]);

  const sendMessage = useCallback(
    (content: string) => {
      socketRef.current?.emit('send-message', { roomId, content });
    },
    [roomId],
  );

  return { sendMessage, connected };
}
