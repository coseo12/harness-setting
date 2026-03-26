'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';

function RedirectHandler() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/chat' : '/login');
    }
  }, [user, loading, router]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      color: 'var(--text-muted)',
    }}>
      로딩 중...
    </div>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <RedirectHandler />
    </AuthProvider>
  );
}
