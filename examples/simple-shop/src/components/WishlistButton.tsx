"use client";

import { useState } from "react";

interface WishlistButtonProps {
  productId: string;
  initialWishlisted: boolean;
  // 외부에서 위시리스트 상태 변경을 감지하기 위한 콜백
  onToggle?: (wishlisted: boolean) => void;
  // 큰 버전 (상세 페이지용)
  large?: boolean;
}

// 위시리스트 토글 버튼 — 골드 하트
export default function WishlistButton({
  productId,
  initialWishlisted,
  onToggle,
  large = false,
}: WishlistButtonProps) {
  const [wishlisted, setWishlisted] = useState(initialWishlisted);
  const [loading, setLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent) => {
    // 카드 내 클릭 이벤트 전파 방지
    e.preventDefault();
    e.stopPropagation();

    setLoading(true);
    try {
      if (wishlisted) {
        await fetch(`/api/wishlist/${productId}`, { method: "DELETE" });
        setWishlisted(false);
        onToggle?.(false);
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId }),
        });
        setWishlisted(true);
        onToggle?.(true);
      }
    } catch (error) {
      console.error("위시리스트 처리 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = large ? "p-3" : "p-2";
  const iconSize = large ? "h-7 w-7" : "h-5 w-5";

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`${sizeClasses} rounded-full transition-colors
        ${wishlisted ? "text-[var(--color-gold)]" : "text-[var(--color-warm-gray)] hover:text-[var(--color-gold)]"}
        ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        hover:bg-white/50`}
      aria-label={wishlisted ? "위시리스트에서 제거" : "위시리스트에 추가"}
    >
      <svg
        className={iconSize}
        fill={wishlisted ? "currentColor" : "none"}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  );
}
