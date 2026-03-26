// 이메일 형식 검증
export function validateEmail(email: unknown): string | null {
  if (!email || typeof email !== 'string') return '이메일을 입력해주세요.';
  const trimmed = email.trim();
  if (trimmed.length === 0) return '이메일을 입력해주세요.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return '올바른 이메일 형식이 아닙니다.';
  if (trimmed.length > 255) return '이메일이 너무 깁니다.';
  return null;
}

// 비밀번호 검증 (최소 6자)
export function validatePassword(password: unknown): string | null {
  if (!password || typeof password !== 'string') return '비밀번호를 입력해주세요.';
  if (password.length < 6) return '비밀번호는 최소 6자 이상이어야 합니다.';
  if (password.length > 100) return '비밀번호가 너무 깁니다.';
  return null;
}

// 닉네임 검증 (2~20자)
export function validateNickname(nickname: unknown): string | null {
  if (!nickname || typeof nickname !== 'string') return '닉네임을 입력해주세요.';
  const trimmed = nickname.trim();
  if (trimmed.length < 2) return '닉네임은 최소 2자 이상이어야 합니다.';
  if (trimmed.length > 20) return '닉네임은 20자 이하여야 합니다.';
  return null;
}

// 채팅방 이름 검증 (1~50자)
export function validateRoomName(name: unknown): string | null {
  if (!name || typeof name !== 'string') return '채팅방 이름을 입력해주세요.';
  const trimmed = name.trim();
  if (trimmed.length === 0) return '채팅방 이름을 입력해주세요.';
  if (trimmed.length > 50) return '채팅방 이름은 50자 이하여야 합니다.';
  return null;
}

// 메시지 내용 검증 (1~2000자)
export function validateMessageContent(content: unknown): string | null {
  if (!content || typeof content !== 'string') return '메시지를 입력해주세요.';
  const trimmed = content.trim();
  if (trimmed.length === 0) return '메시지를 입력해주세요.';
  if (trimmed.length > 2000) return '메시지는 2000자 이하여야 합니다.';
  return null;
}
