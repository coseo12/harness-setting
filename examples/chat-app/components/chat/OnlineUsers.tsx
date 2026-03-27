'use client';

import type { PublicUser } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface OnlineUsersProps {
  users: PublicUser[];
}

export default function OnlineUsers({ users }: OnlineUsersProps) {
  if (users.length === 0) return null;

  return (
    <div className="online-users-panel">
      <div className="online-users-title">접속 중 ({users.length})</div>
      <div className="online-users-list">
        {users.map((user) => (
          <div key={user.id} className="online-user">
            <Avatar nickname={user.nickname} size="sm" online />
            <span className="online-user-name">{user.nickname}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
