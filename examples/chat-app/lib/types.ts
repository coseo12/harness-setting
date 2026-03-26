// === 엔티티 타입 ===

export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string | null;
  createdAt: string;
}

// 비밀번호 제외한 공개 정보
export type PublicUser = Omit<User, 'email'>;

export interface Room {
  id: string;
  name: string;
  createdAt: string;
  memberCount?: number;
  lastMessage?: Message | null;
}

export interface Message {
  id: string;
  content: string;
  userId: string;
  roomId: string;
  createdAt: string;
  user?: PublicUser;
}

// === API 요청 타입 ===

export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateRoomRequest {
  name: string;
}

export interface SendMessageRequest {
  content: string;
}

// === API 응답 타입 ===

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
  };
}

// === Socket.IO 이벤트 타입 ===

export interface ServerToClientEvents {
  'new-message': (message: Message) => void;
  'user-joined': (data: { user: PublicUser; roomId: string }) => void;
  'user-left': (data: { userId: string; roomId: string }) => void;
  'online-users': (data: { roomId: string; users: PublicUser[] }) => void;
  'error': (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  'join-room': (data: { roomId: string }) => void;
  'leave-room': (data: { roomId: string }) => void;
  'send-message': (data: { roomId: string; content: string }) => void;
}
