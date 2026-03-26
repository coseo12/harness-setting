'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider } from '@/contexts/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import RegisterForm from '@/components/auth/RegisterForm';

function RegisterPage() {
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
          <p>새 계정을 만들어 시작하세요</p>
        </div>
        <div className="glass-card" style={{ padding: '28px' }}>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}

export default function RegisterPageWrapper() {
  return (
    <AuthProvider>
      <RegisterPage />
    </AuthProvider>
  );
}
