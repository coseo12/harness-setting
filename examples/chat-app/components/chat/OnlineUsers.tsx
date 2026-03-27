'use client';

import type { PublicUser } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface OnlineUsersProps {
  users: PublicUser[];
}

export default function OnlineUsers({ users }: OnlineUsersProps) {
  // 사용자 없으면 섹션 숨김
  if (users.length === 0) return null;

  return (
    <div className="online-users-bar">
      <div className="online-users-scroll">
        {users.map((user) => (
          <div key={user.id} className="online-user-item">
            <div className="online-user-avatar">
              <Avatar nickname={user.nickname} size="md" />
              <span className="online-user-dot" />
            </div>
            <span className="online-user-name">{user.nickname}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
