'use client';

interface FilterTabsProps {
  categories: { key: string; label: string }[];
  selected: string;
  onSelect: (key: string) => void;
}

// 필터 탭 바 컴포넌트 - pill 형태 가로 나열
export default function FilterTabs({
  categories,
  selected,
  onSelect,
}: FilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isActive = selected === cat.key;
        return (
          <button
            key={cat.key}
            onClick={() => onSelect(cat.key)}
            className="rounded-full px-4 py-2 text-sm font-medium transition-all duration-200"
            style={{
              backgroundColor: isActive
                ? 'var(--accent-yellow)'
                : 'var(--bg-card)',
              color: isActive
                ? 'var(--text-primary)'
                : 'var(--text-secondary)',
              boxShadow: isActive ? 'none' : 'var(--shadow)',
            }}
          >
            {cat.label}
          </button>
        );
      })}
    </div>
  );
}
