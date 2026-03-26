import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as register } from '@/app/api/auth/register/route';
import { POST as createRoom } from '@/app/api/rooms/route';
import { GET as getMessages } from '@/app/api/rooms/[id]/messages/route';
import { prisma } from '@/lib/db/prisma';

let token: string;
let userId: string;
let roomId: string;

function createRequest(
  url: string,
  options: { method?: string; body?: unknown; token?: string } = {},
) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  return new NextRequest(`http://localhost:3000${url}`, {
    method: options.method || 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
}

beforeEach(async () => {
  await prisma.message.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  // 사용자 + 방 생성
  const regRes = await register(
    new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'msg@test.com', password: '123456', nickname: '메시지유저' }),
    }),
  );
  const regData = await regRes.json();
  token = regData.token;
  userId = regData.user.id;

  const roomRes = await createRoom(
    createRequest('/api/rooms', { method: 'POST', body: { name: '메시지 테스트방' }, token }),
  );
  const roomData = await roomRes.json();
  roomId = roomData.room.id;
});

describe('GET /api/rooms/[id]/messages', () => {
  it('빈 메시지 목록을 반환한다', async () => {
    const res = await getMessages(
      createRequest(`/api/rooms/${roomId}/messages`, { token }),
      { params: Promise.resolve({ id: roomId }) },
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.messages).toHaveLength(0);
    expect(data.nextCursor).toBeNull();
  });

  it('메시지 목록을 반환한다', async () => {
    // 메시지 직접 생성
    await prisma.message.create({
      data: { content: '안녕하세요!', userId, roomId },
    });
    await prisma.message.create({
      data: { content: '반갑습니다!', userId, roomId },
    });

    const res = await getMessages(
      createRequest(`/api/rooms/${roomId}/messages`, { token }),
      { params: Promise.resolve({ id: roomId }) },
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.messages).toHaveLength(2);
    expect(data.messages[0].user.nickname).toBe('메시지유저');
  });

  it('존재하지 않는 방은 404를 반환한다', async () => {
    const res = await getMessages(
      createRequest('/api/rooms/nonexistent/messages', { token }),
      { params: Promise.resolve({ id: 'nonexistent' }) },
    );
    expect(res.status).toBe(404);
  });
});
