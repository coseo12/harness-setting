'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 로그인 페이지 비활성화 - 루트로 리다이렉트
export default function LoginPageWrapper() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return null;
}
