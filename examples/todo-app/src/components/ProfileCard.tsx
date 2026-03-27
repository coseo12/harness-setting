'use client';

import { UserProfile } from '@/data/types';

interface ProfileCardProps {
  user: UserProfile;
}

// 사용자 프로필 카드 컴포넌트
export default function ProfileCard({ user }: ProfileCardProps) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl p-5"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-neumorphic)',
      }}
    >
      {/* 아바타 이미지 - next/image 대신 일반 img 사용 */}
      <img
        src={user.avatar}
        alt={`${user.name} 프로필 사진`}
        width={56}
        height={56}
        className="rounded-full object-cover"
        style={{ width: 56, height: 56 }}
      />
      <div>
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)' }}
        >
          {user.name}
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {user.role}
        </p>
      </div>
    </div>
  );
}
