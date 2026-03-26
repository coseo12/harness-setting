import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterForm from '@/components/auth/RegisterForm';
import { AuthContext } from '@/contexts/AuthContext';

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

describe('RegisterForm', () => {
  it('닉네임, 이메일, 비밀번호, 비밀번호 확인 필드를 렌더링한다', () => {
    renderWithAuth(<RegisterForm />);
    expect(screen.getByLabelText('닉네임')).toBeInTheDocument();
    expect(screen.getByLabelText('이메일')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호')).toBeInTheDocument();
    expect(screen.getByLabelText('비밀번호 확인')).toBeInTheDocument();
  });

  it('비밀번호 불일치 시 에러를 표시한다', async () => {
    renderWithAuth(<RegisterForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('닉네임'), '테스터');
    await user.type(screen.getByLabelText('이메일'), 'a@b.com');
    await user.type(screen.getByLabelText('비밀번호'), '123456');
    await user.type(screen.getByLabelText('비밀번호 확인'), '654321');
    await user.click(screen.getByRole('button', { name: '회원가입' }));
    expect(screen.getByText('비밀번호가 일치하지 않습니다.')).toBeInTheDocument();
  });

  it('회원가입 성공 시 login 함수를 호출한다', async () => {
    const mockUser = { id: '1', email: 'a@b.com', nickname: '테스터', avatar: null, createdAt: '' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user: mockUser, token: 'tok123' }),
    }));

    renderWithAuth(<RegisterForm />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('닉네임'), '테스터');
    await user.type(screen.getByLabelText('이메일'), 'a@b.com');
    await user.type(screen.getByLabelText('비밀번호'), '123456');
    await user.type(screen.getByLabelText('비밀번호 확인'), '123456');
    await user.click(screen.getByRole('button', { name: '회원가입' }));

    await vi.waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockUser, 'tok123');
    });
  });
});
