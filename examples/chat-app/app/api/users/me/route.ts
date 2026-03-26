import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth/middleware';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
      { status: 401 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (!user) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '사용자를 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString(),
    },
  });
}
