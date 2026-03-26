'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { registerUser } from '@/lib/api-client';

export default function RegisterForm() {
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
    const confirmPassword = formData.get('confirmPassword') as string;
    const nickname = (formData.get('nickname') as string).trim();

    if (!email || !password || !nickname) {
      setError('모든 항목을 입력해주세요.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      setLoading(false);
      return;
    }

    try {
      const { user, token } = await registerUser(email, password, nickname);
      login(user, token);
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      {error && <div className="form-error">{error}</div>}
      <div className="form-group">
        <label htmlFor="nickname">닉네임</label>
        <input
          id="nickname"
          name="nickname"
          type="text"
          className="form-input"
          placeholder="2~20자"
          autoComplete="username"
        />
      </div>
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
          autoComplete="new-password"
        />
      </div>
      <div className="form-group">
        <label htmlFor="confirmPassword">비밀번호 확인</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          className="form-input"
          placeholder="비밀번호를 다시 입력"
          autoComplete="new-password"
        />
      </div>
      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? '가입 중...' : '회원가입'}
      </button>
      <p className="auth-link">
        이미 계정이 있으신가요? <a href="/login">로그인</a>
      </p>
    </form>
  );
}
