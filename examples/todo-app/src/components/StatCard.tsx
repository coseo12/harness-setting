'use client';

interface StatCardProps {
  label: string;
  value: number | string;
  suffix?: string;
}

// 통계 카드 컴포넌트 - 큰 숫자 + 작은 라벨
export default function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-2xl px-6 py-5"
      style={{
        backgroundColor: 'var(--bg-card)',
        boxShadow: 'var(--shadow-neumorphic)',
      }}
    >
      <span
        className="text-3xl font-bold"
        style={{ color: 'var(--text-primary)' }}
      >
        {value}
        {suffix && (
          <span className="text-xl font-semibold">{suffix}</span>
        )}
      </span>
      <span
        className="mt-1 text-xs font-medium"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </span>
    </div>
  );
}
