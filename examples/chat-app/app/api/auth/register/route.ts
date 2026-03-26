import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/auth/password';
import { signToken } from '@/lib/auth/jwt';
import { validateEmail, validatePassword, validateNickname } from '@/lib/validation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, nickname } = body;

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

    const nicknameError = validateNickname(nickname);
    if (nicknameError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: nicknameError } },
        { status: 400 },
      );
    }

    // 이메일 중복 확인
    const existing = await prisma.user.findUnique({
      where: { email: email.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: { code: 'DUPLICATE_EMAIL', message: '이미 사용 중인 이메일입니다.' } },
        { status: 409 },
      );
    }

    // 사용자 생성
    const hashedPassword = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email: email.trim(),
        password: hashedPassword,
        nickname: nickname.trim(),
      },
    });

    // 토큰 발급
    const token = await signToken({ userId: user.id, email: user.email });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          nickname: user.nickname,
          avatar: user.avatar,
          createdAt: user.createdAt.toISOString(),
        },
        token,
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
