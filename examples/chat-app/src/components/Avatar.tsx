'use client';

/** 아바타 크기 맵 (px) */
const SIZE_MAP = {
  xs: 24,
  sm: 32,
  md: 44,
  lg: 56,
  xl: 80,
} as const;

/** 온라인 표시 점 크기 맵 */
const DOT_SIZE_MAP = {
  xs: 'w-2 h-2',
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3.5 h-3.5',
  xl: 'w-4 h-4',
} as const;

interface AvatarProps {
  src?: string;
  nickname: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
}

export default function Avatar({
  src,
  nickname,
  size = 'md',
  online,
}: AvatarProps) {
  const px = SIZE_MAP[size];
  const initial = nickname.charAt(0);

  return (
    <div className="relative inline-flex shrink-0" style={{ width: px, height: px }}>
      {src ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={src}
          alt={nickname}
          width={px}
          height={px}
          className="rounded-full object-cover"
          style={{ width: px, height: px }}
        />
      ) : (
        /* 사진 없으면 이니셜 아바타 */
        <div
          className="avatar-gradient flex items-center justify-center rounded-full text-white font-semibold"
          style={{
            width: px,
            height: px,
            fontSize: px * 0.4,
          }}
        >
          {initial}
        </div>
      )}

      {/* 온라인 상태 표시 점 */}
      {online && (
        <span
          className={`absolute bottom-0 right-0 ${DOT_SIZE_MAP[size]} rounded-full bg-accent-green ring-2 ring-[#0D0D1A]`}
        />
      )}
    </div>
  );
}
