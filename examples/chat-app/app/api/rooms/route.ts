import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getAuthUser } from '@/lib/auth/middleware';
import { validateRoomName } from '@/lib/validation';

export const runtime = 'nodejs';

// 채팅방 목록 조회
export async function GET(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
      { status: 401 },
    );
  }

  const rooms = await prisma.room.findMany({
    include: {
      _count: { select: { members: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { user: { select: { id: true, nickname: true, avatar: true } } },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = rooms.map((room) => ({
    id: room.id,
    name: room.name,
    createdAt: room.createdAt.toISOString(),
    memberCount: room._count.members,
    lastMessage: room.messages[0]
      ? {
          id: room.messages[0].id,
          content: room.messages[0].content,
          userId: room.messages[0].userId,
          roomId: room.messages[0].roomId,
          createdAt: room.messages[0].createdAt.toISOString(),
          user: {
            id: room.messages[0].user.id,
            nickname: room.messages[0].user.nickname,
            avatar: room.messages[0].user.avatar,
            createdAt: '',
          },
        }
      : null,
  }));

  return NextResponse.json({ rooms: result });
}

// 채팅방 생성
export async function POST(request: NextRequest) {
  const auth = await getAuthUser(request);
  if (!auth) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '인증이 필요합니다.' } },
      { status: 401 },
    );
  }

  try {
    const body = await request.json();
    const nameError = validateRoomName(body.name);
    if (nameError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: nameError } },
        { status: 400 },
      );
    }

    // 방 생성 + 생성자 자동 입장
    const room = await prisma.room.create({
      data: {
        name: body.name.trim(),
        members: {
          create: { userId: auth.userId },
        },
      },
    });

    return NextResponse.json(
      {
        room: {
          id: room.id,
          name: room.name,
          createdAt: room.createdAt.toISOString(),
          memberCount: 1,
          lastMessage: null,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
