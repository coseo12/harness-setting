'use client';

interface AvatarProps {
  nickname: string;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
}

export default function Avatar({ nickname, size = 'md', online }: AvatarProps) {
  // 닉네임 첫 글자 (한글/영문 모두 지원)
  const initial = nickname.charAt(0).toUpperCase();

  return (
    <div className={`avatar ${size}`}>
      {initial}
      {online && <span className="avatar-online" />}
    </div>
  );
}
