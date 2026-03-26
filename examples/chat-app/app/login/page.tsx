'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import LoginForm from '@/components/auth/LoginForm';

function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/chat');
    }
  }, [user, loading, router]);

  if (loading) return null;

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="gradient-text">ChatApp</h1>
          <p>로그인하여 채팅을 시작하세요</p>
        </div>
        <div className="glass-card" style={{ padding: '28px' }}>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}

export default function LoginPageWrapper() {
  return (
    <AuthProvider>
      <LoginPage />
    </AuthProvider>
  );
}
