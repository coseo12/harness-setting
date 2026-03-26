import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth/middleware';

export const runtime = 'nodejs';

// 채팅방 상세 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  const room = await prisma.room.findUnique({
    where: { id },
    include: {
      members: {
        include: {
          user: { select: { id: true, nickname: true, avatar: true, createdAt: true } },
        },
      },
      _count: { select: { members: true } },
    },
  });

  if (!room) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '채팅방을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  return NextResponse.json({
    room: {
      id: room.id,
      name: room.name,
      createdAt: room.createdAt.toISOString(),
      memberCount: room._count.members,
      members: room.members.map((m) => ({
        id: m.user.id,
        nickname: m.user.nickname,
        avatar: m.user.avatar,
        createdAt: m.user.createdAt.toISOString(),
      })),
    },
  });
}
