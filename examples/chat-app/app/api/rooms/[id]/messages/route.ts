import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth/middleware';

export const runtime = 'nodejs';

const PAGE_SIZE = 50;

// 채팅방 메시지 조회 (커서 기반 페이지네이션)
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

  // 방 존재 확인
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: '채팅방을 찾을 수 없습니다.' } },
      { status: 404 },
    );
  }

  // 커서 기반 페이지네이션
  const cursor = request.nextUrl.searchParams.get('cursor');
  const messages = await prisma.message.findMany({
    where: { roomId: id },
    include: {
      user: { select: { id: true, nickname: true, avatar: true, createdAt: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: PAGE_SIZE + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = messages.length > PAGE_SIZE;
  const result = hasMore ? messages.slice(0, PAGE_SIZE) : messages;

  return NextResponse.json({
    messages: result.map((m) => ({
      id: m.id,
      content: m.content,
      userId: m.userId,
      roomId: m.roomId,
      createdAt: m.createdAt.toISOString(),
      user: {
        id: m.user.id,
        nickname: m.user.nickname,
        avatar: m.user.avatar,
        createdAt: m.user.createdAt.toISOString(),
      },
    })),
    nextCursor: hasMore ? result[result.length - 1].id : null,
  });
}
