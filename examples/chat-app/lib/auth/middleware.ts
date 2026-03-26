import { NextRequest } from 'next/server';
import { verifyToken, type JwtPayload } from './jwt';

// Request에서 인증된 사용자 정보 추출
export async function getAuthUser(
  request: NextRequest,
): Promise<JwtPayload | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  return verifyToken(token);
}
