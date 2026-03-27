'use client';

import { useState } from 'react';
import { ChatRoom, Message, User } from '@/data/types';
import { CURRENT_USER_ID } from '@/data/mock';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';

interface ChatViewProps {
  room: ChatRoom;
  messages: Message[];
  users: User[];
  onBack: () => void;
  onSelectUser: (user: User) => void;
  onSendMessage: (content: string) => void;
}

export default function ChatView({
  room,
  messages,
  users,
  onBack,
  onSelectUser,
  onSendMessage,
}: ChatViewProps) {
  const [inputValue, setInputValue] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  // "준비 중" 알럿 표시
  const showComingSoon = (feature: string) => {
    setToast(`${feature} 기능은 준비 중입니다`);
    setTimeout(() => setToast(null), 2000);
  };

  // 메시지 전송 핸들러
  const handleSend = () => {
    if (!inputValue.trim()) return;
    onSendMessage(inputValue);
    setInputValue('');
  };

  // Enter 키로 전송
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 상대방 사용자 찾기 (1:1 대화의 경우)
  const otherMember = room.members.find((m) => m.id !== CURRENT_USER_ID);
  const isGroup = room.members.length > 2;

  // senderId로 사용자 찾기
  const findUser = (senderId: string): User | undefined =>
    users.find((u) => u.id === senderId);

  return (
    <div className="flex flex-col h-full relative">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border-subtle">
        {/* 뒤로가기 */}
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* 프로필 */}
        <button
          className="flex items-center gap-3 flex-1 min-w-0"
          onClick={() => otherMember && onSelectUser(otherMember)}
        >
          <Avatar
            src={otherMember?.avatar}
            nickname={room.name}
            size="sm"
            online={otherMember?.online}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-text-primary truncate">
              {room.name}
            </h3>
            {otherMember?.online ? (
              <span className="text-xs text-accent-green">접속 중</span>
            ) : (
              <span className="text-xs text-text-muted">
                마지막 접속: {otherMember?.lastSeen ?? '알 수 없음'}
              </span>
            )}
          </div>
        </button>

        {/* 통화 버튼 */}
        <div className="flex gap-1">
          <button onClick={() => showComingSoon('음성통화')} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button onClick={() => showComingSoon('영상통화')} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* 그룹 채팅 멤버 표시 */}
        {isGroup && (
          <div className="text-center mb-4">
            <span className="text-xs text-text-muted">
              {room.members.map((m) => m.nickname).join(', ')}
            </span>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isMine={msg.senderId === CURRENT_USER_ID}
            sender={findUser(msg.senderId)}
          />
        ))}
      </div>

      {/* 입력 바 */}
      <div className="px-4 py-3 border-t border-border-subtle">
        <div className="flex items-center gap-2">
          {/* 이모지 버튼 */}
          <button onClick={() => showComingSoon('이모지')} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* 첨부 버튼 */}
          <button onClick={() => showComingSoon('파일 첨부')} className="p-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>

          {/* 입력 필드 */}
          <input
            type="text"
            placeholder="메시지 입력..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-bg-card border border-border-subtle rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none focus:border-accent-blue/40 transition-colors"
          />

          {/* 전송 버튼 */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="p-2 rounded-lg bg-accent-blue hover:bg-accent-blue/80 transition-colors text-white shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
      {/* 준비 중 토스트 알럿 */}
      {toast && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-border-subtle text-sm text-text-primary animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}
