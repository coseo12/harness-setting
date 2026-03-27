'use client';

import { useState, type FormEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { registerUser, loginUser } from '@/lib/api-client';

const GUEST_PASSWORD = 'guest-password';

export default function NicknameModal() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 닉네임으로 게스트 이메일 생성
  function toGuestEmail(nickname: string): string {
    return `${nickname.toLowerCase().replace(/\s/g, '-')}@guest.local`;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const formData = new FormData(e.currentTarget);
    const nickname = (formData.get('nickname') as string).trim();

    if (!nickname || nickname.length < 2) {
      setError('닉네임은 최소 2자 이상 입력해주세요.');
      return;
    }

    setLoading(true);
    const email = toGuestEmail(nickname);

    try {
      // 먼저 회원가입 시도
      const data = await registerUser(email, GUEST_PASSWORD, nickname);
      login(data.user, data.token);
    } catch {
      // 이미 존재하는 경우 로그인 시도
      try {
        const data = await loginUser(email, GUEST_PASSWORD);
        login(data.user, data.token);
      } catch (loginErr) {
        setError(
          loginErr instanceof Error
            ? loginErr.message
            : '입장에 실패했습니다. 다시 시도해주세요.',
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" style={{ background: 'rgba(0, 0, 0, 0.85)' }}>
      <div className="glass-card modal-content" style={{ textAlign: 'center' }}>
        {/* 채팅 아이콘 */}
        <div style={{ marginBottom: '8px' }}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--accent-blue)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.8 }}
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h2 className="gradient-text" style={{ fontSize: '24px', fontWeight: 700, marginBottom: '4px' }}>
          ChatApp
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
          닉네임을 입력하고 채팅을 시작하세요
        </p>

        <form onSubmit={handleSubmit}>
          {error && <div className="form-error" style={{ marginBottom: '12px', textAlign: 'left' }}>{error}</div>}
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <input
              name="nickname"
              type="text"
              className="form-input"
              placeholder="닉네임을 입력하세요"
              maxLength={20}
              minLength={2}
              autoFocus
              autoComplete="off"
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '입장 중...' : '채팅 시작'}
          </button>
        </form>
      </div>
    </div>
  );
}
