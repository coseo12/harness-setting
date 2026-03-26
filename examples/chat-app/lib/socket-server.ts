import type { Server, Socket } from 'socket.io';
import { prisma } from './db/prisma';
import { verifyToken } from './auth/jwt';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

interface AuthenticatedSocket extends Socket<ClientToServerEvents, ServerToClientEvents> {
  userId?: string;
  nickname?: string;
}

// 방별 온라인 사용자 맵: roomId → Set<userId>
const roomOnlineUsers = new Map<string, Set<string>>();

export function setupSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
) {
  // 인증 미들웨어
  io.use(async (socket: AuthenticatedSocket, next) => {
    const token = socket.handshake.auth.token as string;
    if (!token) return next(new Error('인증 토큰이 필요합니다.'));

    const payload = await verifyToken(token);
    if (!payload) return next(new Error('유효하지 않은 토큰입니다.'));

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, nickname: true },
    });
    if (!user) return next(new Error('사용자를 찾을 수 없습니다.'));

    socket.userId = user.id;
    socket.nickname = user.nickname;
    next();
  });

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as AuthenticatedSocket;
    const userId = socket.userId!;
    const nickname = socket.nickname!;

    // 방 입장
    socket.on('join-room', async ({ roomId }) => {
      socket.join(roomId);

      // RoomMember에 추가 (이미 있으면 무시)
      await prisma.roomMember.upsert({
        where: { userId_roomId: { userId, roomId } },
        update: {},
        create: { userId, roomId },
      });

      // 온라인 사용자 추가
      if (!roomOnlineUsers.has(roomId)) {
        roomOnlineUsers.set(roomId, new Set());
      }
      roomOnlineUsers.get(roomId)!.add(userId);

      // 다른 사용자에게 입장 알림
      socket.to(roomId).emit('user-joined', {
        user: { id: userId, nickname, avatar: null, createdAt: '' },
        roomId,
      });

      // 현재 온라인 사용자 목록 전송
      await broadcastOnlineUsers(io, roomId);
    });

    // 방 퇴장
    socket.on('leave-room', ({ roomId }) => {
      socket.leave(roomId);
      removeFromOnline(roomId, userId);
      socket.to(roomId).emit('user-left', { userId, roomId });
      broadcastOnlineUsers(io, roomId);
    });

    // 메시지 전송
    socket.on('send-message', async ({ roomId, content }) => {
      if (!content.trim()) return;

      const message = await prisma.message.create({
        data: { content: content.trim(), userId, roomId },
        include: {
          user: { select: { id: true, nickname: true, avatar: true, createdAt: true } },
        },
      });

      const messageData = {
        id: message.id,
        content: message.content,
        userId: message.userId,
        roomId: message.roomId,
        createdAt: message.createdAt.toISOString(),
        user: {
          id: message.user.id,
          nickname: message.user.nickname,
          avatar: message.user.avatar,
          createdAt: message.user.createdAt.toISOString(),
        },
      };

      // 방의 모든 사용자에게 브로드캐스트 (본인 포함)
      io.to(roomId).emit('new-message', messageData);
    });

    // 연결 해제
    socket.on('disconnect', () => {
      // 모든 방에서 제거
      for (const [roomId, users] of roomOnlineUsers.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          socket.to(roomId).emit('user-left', { userId, roomId });
          broadcastOnlineUsers(io, roomId);
        }
      }
    });
  });
}

function removeFromOnline(roomId: string, userId: string) {
  const users = roomOnlineUsers.get(roomId);
  if (users) {
    users.delete(userId);
    if (users.size === 0) roomOnlineUsers.delete(roomId);
  }
}

async function broadcastOnlineUsers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string,
) {
  const userIds = Array.from(roomOnlineUsers.get(roomId) || []);
  if (userIds.length === 0) {
    io.to(roomId).emit('online-users', { roomId, users: [] });
    return;
  }

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, nickname: true, avatar: true, createdAt: true },
  });

  io.to(roomId).emit('online-users', {
    roomId,
    users: users.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      avatar: u.avatar,
      createdAt: u.createdAt.toISOString(),
    })),
  });
}
