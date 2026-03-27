"use client";

import { useSearchParams, useRouter } from "next/navigation";

const CATEGORIES = ["전체", "전자기기", "패션", "생활용품"];

/* 카테고리 네비게이션 — URL searchParams와 동기화 */
export default function CategoryNav() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const currentCategory = searchParams.get("category") || "전체";

  const handleClick = (category: string) => {
    if (category === "전체") {
      router.push("/");
    } else {
      router.push(`/?category=${encodeURIComponent(category)}`);
    }
    // 제품 섹션으로 스크롤
    setTimeout(() => {
      document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-8 h-10 text-sm tracking-wide">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => handleClick(category)}
            className={`transition-colors cursor-pointer ${
              currentCategory === category
                ? "text-[var(--color-charcoal)] font-medium"
                : "text-[var(--color-warm-gray)] hover:text-[var(--color-gold)]"
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </nav>
  );
}
