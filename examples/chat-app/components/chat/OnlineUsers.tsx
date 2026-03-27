'use client';

import type { PublicUser } from '@/lib/types';
import Avatar from '@/components/ui/Avatar';

interface OnlineUsersProps {
  users: PublicUser[];
}

export default function OnlineUsers({ users }: OnlineUsersProps) {
  if (users.length === 0) return null;

  return (
    <div className="online-users-panel" style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
      <div className="online-users-list" style={{ display: 'flex', flexWrap: 'nowrap', overflowX: 'auto', gap: '16px', paddingBottom: '4px' }}>
        {users.map((user) => (
          <div key={user.id} className="online-user" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', flexShrink: 0, minWidth: '48px', maxWidth: '56px' }}>
            <Avatar nickname={user.nickname} online />
            <span style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textAlign: 'center',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
            }}>
              {user.nickname}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
