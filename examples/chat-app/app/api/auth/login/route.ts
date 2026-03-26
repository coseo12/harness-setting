import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { validateEmail, validatePassword } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // 입력 검증
    const emailError = validateEmail(email);
    if (emailError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: emailError } },
        { status: 400 },
      );
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: passwordError } },
        { status: 400 },
      );
    }

    // 사용자 조회
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });
    if (!user) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
        { status: 401 },
      );
    }

    // 비밀번호 검증
    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      return NextResponse.json(
        { error: { code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다.' } },
        { status: 401 },
      );
    }

    // 토큰 발급
    const token = await signToken({ userId: user.id, email: user.email });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.createdAt.toISOString(),
      },
      token,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 },
    );
  }
}
