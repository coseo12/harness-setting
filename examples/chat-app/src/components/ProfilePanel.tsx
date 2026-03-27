'use client';

import { ChatRoom } from '@/data/types';
import { CURRENT_USER_ID } from '@/data/mock';
import Avatar from './Avatar';

interface ProfilePanelProps {
  room: ChatRoom;
  onClose: () => void;
}

export default function ProfilePanel({ room, onClose }: ProfilePanelProps) {
  // 1:1 대화의 상대방 또는 그룹 정보
  const otherMember = room.members.find((m) => m.id !== CURRENT_USER_ID);
  const isGroup = room.members.length > 2;

  return (
    <div className="w-[280px] h-full glass-panel rounded-2xl flex flex-col shrink-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle">
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex gap-1">
          {/* 멤버 추가 (장식용) */}
          <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </button>
          {/* 더보기 (장식용) */}
          <button className="p-1.5 rounded-lg hover:bg-white/5 transition-colors text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 프로필 정보 */}
      <div className="flex-1 flex flex-col items-center pt-8 px-4">
        {/* 큰 아바타 */}
        <Avatar
          src={isGroup ? undefined : otherMember?.avatar}
          nickname={room.name}
          size="xl"
          online={isGroup ? undefined : otherMember?.online}
        />

        {/* 이름 */}
        <h3 className="text-lg font-semibold text-text-primary mt-4">
          {room.name}
        </h3>

        {/* 상태 정보 */}
        {isGroup ? (
          <p className="text-sm text-text-secondary mt-1">
            {room.members.length}명의 멤버
          </p>
        ) : otherMember?.online ? (
          <p className="text-sm text-accent-green mt-1">접속 중</p>
        ) : (
          <p className="text-sm text-text-muted mt-1">
            마지막 접속: {otherMember?.lastSeen ?? '알 수 없음'}
          </p>
        )}

        {/* 그룹 멤버 목록 */}
        {isGroup && (
          <div className="w-full mt-6">
            <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
              멤버
            </h4>
            <div className="flex flex-col gap-2">
              {room.members.map((member) => (
                <div key={member.id} className="flex items-center gap-2.5">
                  <Avatar
                    src={member.avatar}
                    nickname={member.nickname}
                    size="sm"
                    online={member.online}
                  />
                  <span className="text-sm text-text-primary">
                    {member.nickname}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 통화 버튼 그룹 (장식용) */}
        <div className="flex gap-3 mt-8">
          {/* 비디오 */}
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          {/* 마이크 */}
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          {/* 화면공유 */}
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </button>
          {/* 스피커 */}
          <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors text-text-secondary">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
          </button>
          {/* 종료 (빨강) */}
          <button className="w-10 h-10 rounded-full bg-accent-red/20 flex items-center justify-center hover:bg-accent-red/30 transition-colors text-accent-red">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
