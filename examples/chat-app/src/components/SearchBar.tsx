'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="relative px-4 py-3">
      <div className="flex items-center gap-2 rounded-xl bg-bg-card px-3 py-2.5 border border-border-subtle">
        {/* 돋보기 아이콘 */}
        <svg
          className="w-4 h-4 text-text-muted shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-text-primary placeholder-text-muted outline-none"
        />
      </div>
    </div>
  );
}
