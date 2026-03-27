'use client';

import { User } from '@/data/types';
import Avatar from './Avatar';

interface OnlineAvatarsProps {
  users: User[];
}

export default function OnlineAvatars({ users }: OnlineAvatarsProps) {
  // 온라인 사용자만 필터링
  const onlineUsers = users.filter((u) => u.online);

  return (
    <div className="px-4 py-2">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {onlineUsers.map((user) => (
          <div
            key={user.id}
            className="flex flex-col items-center gap-1 shrink-0"
          >
            <Avatar
              src={user.avatar}
              nickname={user.nickname}
              size="md"
              online
            />
            <span className="text-[11px] text-text-secondary truncate w-12 text-center">
              {user.nickname}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
