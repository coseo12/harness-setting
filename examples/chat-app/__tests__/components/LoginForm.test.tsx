import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '@/components/auth/LoginForm';
import { AuthContext } from '@/contexts/AuthContext';

// fetch mock
const mockLogin = vi.fn();

function renderWithAuth(ui: React.ReactElement) {
  return render(
    <AuthContext.Provider
      value={{ user: null, token: null, loading: false, login: mockLogin, logout: vi.fn() }}
    >
      {ui}
    </AuthContext.Provider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
});

describe('LoginForm', () => {
  it('이메일과 비밀번호 입력 필드를 렌더링한다', () => {
    renderWithAuth(<LoginForm />);
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });

  it('빈 입력 시 에러를 표시한다', async () => {
    renderWithAuth(<LoginForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: '로그인' }));
    expect(screen.getByText('이메일과 비밀번호를 입력해주세요.')).toBeInTheDocument();
  });

  it('로그인 성공 시 login 함수를 호출한다', async () => {
    const mockUser = { id: '1', email: 'a@b.com', nickname: '테스터', avatar: null, createdAt: '' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: 'tok123' }),
    }));

    renderWithAuth(<LoginForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('이메일'), 'a@b.com');
    await user.type(screen.getByLabelText('비밀번호'), '123456');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    // fetch가 호출될 때까지 대기
    await vi.waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockUser, 'tok123');
    });
  });
});
