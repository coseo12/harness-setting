import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as register } from '@/app/api/auth/register/route';
import { GET as getRooms, POST as createRoom } from '@/app/api/rooms/route';
import { GET as getRoom } from '@/app/api/rooms/[id]/route';
import { prisma } from '@/lib/db/prisma';

let token: string;

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

  // 테스트 사용자 생성
  const res = await register(
    new NextRequest('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'room@test.com', password: '123456', nickname: '방장' }),
    }),
  );
  const data = await res.json();
  token = data.token;
});

describe('GET /api/rooms', () => {
  it('빈 채팅방 목록을 반환한다', async () => {
    const res = await getRooms(createRequest('/api/rooms', { token }));
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.rooms).toHaveLength(0);
  });

  it('인증 없이 접근하면 401을 반환한다', async () => {
    const res = await getRooms(createRequest('/api/rooms'));
    expect(res.status).toBe(401);
  });
});

describe('POST /api/rooms', () => {
  it('채팅방을 생성한다', async () => {
    const res = await createRoom(
      createRequest('/api/rooms', { method: 'POST', body: { name: '일반 채팅방' }, token }),
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.room.name).toBe('일반 채팅방');
    expect(data.room.memberCount).toBe(1);
  });

  it('방 이름이 없으면 400을 반환한다', async () => {
    const res = await createRoom(
      createRequest('/api/rooms', { method: 'POST', body: { name: '' }, token }),
    );
    expect(res.status).toBe(400);
  });
});

describe('GET /api/rooms/[id]', () => {
  it('채팅방 상세 정보를 반환한다', async () => {
    // 방 생성
    const createRes = await createRoom(
      createRequest('/api/rooms', { method: 'POST', body: { name: '상세 테스트' }, token }),
    );
    const { room } = await createRes.json();

    const res = await getRoom(
      createRequest(`/api/rooms/${room.id}`, { token }),
      { params: Promise.resolve({ id: room.id }) },
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.room.name).toBe('상세 테스트');
    expect(data.room.members).toHaveLength(1);
  });

  it('존재하지 않는 방은 404를 반환한다', async () => {
    const res = await getRoom(
      createRequest('/api/rooms/nonexistent', { token }),
      { params: Promise.resolve({ id: 'nonexistent' }) },
    );
    expect(res.status).toBe(404);
  });
});
