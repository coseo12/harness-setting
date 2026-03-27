'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

// 검색어 입력 컴포넌트 - 돋보기 아이콘과 포커스 링 포함
export default function SearchBar({
  value,
  onChange,
  placeholder = '레시피를 검색하세요...',
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      {/* 돋보기 아이콘 */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1 0 4.5 4.5a7.5 7.5 0 0 0 12.15 12.15z"
        />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none transition-shadow focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
      />
    </div>
  );
}
