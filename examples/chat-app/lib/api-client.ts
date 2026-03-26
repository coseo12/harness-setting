// API 호출 공통 래퍼
const BASE_URL = '/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('chat-app-token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || '요청에 실패했습니다.');
  }

  return data;
}

// === 인증 ===
export async function registerUser(email: string, password: string, nickname: string) {
  return request<{ user: import('./types').User; token: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, nickname }),
  });
}

export async function loginUser(email: string, password: string) {
  return request<{ user: import('./types').User; token: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchMe() {
  return request<{ user: import('./types').User }>('/users/me');
}

// === 채팅방 ===
export async function fetchRooms() {
  return request<{ rooms: import('./types').Room[] }>('/rooms');
}

export async function createRoom(name: string) {
  return request<{ room: import('./types').Room }>('/rooms', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function fetchRoom(id: string) {
  return request<{ room: import('./types').Room & { members: import('./types').PublicUser[] } }>(
    `/rooms/${id}`,
  );
}

// === 메시지 ===
export async function fetchMessages(roomId: string, cursor?: string) {
  const params = cursor ? `?cursor=${cursor}` : '';
  return request<{
    messages: import('./types').Message[];
    nextCursor: string | null;
  }>(`/rooms/${roomId}/messages${params}`);
}
