'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { loginUser } from '@/lib/api-client';

export default function LoginForm() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim();
    const password = formData.get('password') as string;

    if (!email || !password) {
      setError('이메일과 비밀번호를 입력해주세요.');
      setLoading(false);
      return;
    }

    try {
      const { user, token } = await loginUser(email, password);
      login(user, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      <div className="form-group">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          className="form-input"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </div>
      <div className="form-group">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          className="form-input"
          placeholder="6자 이상"
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? '로그인 중...' : '로그인'}
      </button>
      <p className="auth-link">
        계정이 없으신가요? <a href="/register">회원가입</a>
      </p>
    </form>
  );
}
