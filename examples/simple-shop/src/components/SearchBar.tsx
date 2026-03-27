"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

// 검색 입력 컴포넌트 — 소프트베이지 배경, 골드 포커스
export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      {/* 돋보기 아이콘 */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--color-warm-gray)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        type="text"
        placeholder="제품 검색..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-light-gray)] bg-[var(--color-soft-beige)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-gold)] focus:border-transparent
          placeholder-[var(--color-warm-gray)] text-[var(--color-charcoal)]"
      />
    </div>
  );
}
