import { describe, it, expect, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as register } from '@/app/api/auth/register/route';
import { POST as login } from '@/app/api/auth/login/route';
import { prisma } from '@/lib/db/prisma';

function createRequest(body: unknown) {
  return new NextRequest('http://localhost:3000/api/auth', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  await prisma.message.deleteMany();
  await prisma.roomMember.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();
});

describe('POST /api/auth/register', () => {
  it('회원가입 성공 시 user와 token을 반환한다', async () => {
    const res = await register(
      createRequest({ email: 'test@test.com', password: '123456', nickname: '테스터' }),
    );
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.user.email).toBe('test@test.com');
    expect(data.user.nickname).toBe('테스터');
    expect(data.token).toBeDefined();
  });

  it('이메일 중복 시 409를 반환한다', async () => {
    await register(
      createRequest({ email: 'dup@test.com', password: '123456', nickname: '유저1' }),
    );
    const res = await register(
      createRequest({ email: 'dup@test.com', password: '123456', nickname: '유저2' }),
    );
    expect(res.status).toBe(409);
  });

  it('이메일 형식이 잘못되면 400을 반환한다', async () => {
    const res = await register(
      createRequest({ email: 'invalid', password: '123456', nickname: '테스터' }),
    );
    expect(res.status).toBe(400);
  });

  it('비밀번호가 짧으면 400을 반환한다', async () => {
    const res = await register(
      createRequest({ email: 'test@test.com', password: '12', nickname: '테스터' }),
    );
    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await register(
      createRequest({ email: 'login@test.com', password: 'password123', nickname: '로그인유저' }),
    );
  });

  it('로그인 성공 시 user와 token을 반환한다', async () => {
    const res = await login(
      createRequest({ email: 'login@test.com', password: 'password123' }),
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.user.email).toBe('login@test.com');
    expect(data.token).toBeDefined();
  });

  it('비밀번호가 틀리면 401을 반환한다', async () => {
    const res = await login(
      createRequest({ email: 'login@test.com', password: 'wrongpassword' }),
    );
    expect(res.status).toBe(401);
  });
});
