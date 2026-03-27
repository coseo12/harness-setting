'use client';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/* 검색어 입력 컴포넌트 — 어스톤 베이지 스타일 */
export default function SearchBar({
  value,
  onChange,
  placeholder = '레시피를 검색하세요...',
}: SearchBarProps) {
  return (
    <div className="relative w-full">
      {/* 돋보기 아이콘 */}
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#9B8E7E]"
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
        className="w-full rounded-full border border-[#E8DFD0] bg-[#F5F0E8] py-2.5 pl-10 pr-4 text-sm text-[#3D2B1F] outline-none transition-shadow placeholder:text-[#9B8E7E] focus:border-[#8B6914] focus:ring-2 focus:ring-[#8B6914]/30"
      />
    </div>
  );
}
