/** 사용자 정보 */
export interface User {
  id: string;
  nickname: string;
  avatar?: string;
  online: boolean;
  lastSeen?: string;
}

/** 채팅방 정보 */
export interface ChatRoom {
  id: string;
  name: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  members: User[];
}

/** 메시지 정보 */
export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
}
