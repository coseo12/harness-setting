'use client';

import { useState } from 'react';
import StarRating from '@/components/StarRating';

interface RatingSectionProps {
  recipeId: string;
  initialRating: number;
  initialRatingCount: number;
}

/* 별점 인터랙션 섹션 — 어스톤 디자인 */
export default function RatingSection({
  recipeId,
  initialRating,
  initialRatingCount,
}: RatingSectionProps) {
  const [rating, setRating] = useState(initialRating);
  const [ratingCount, setRatingCount] = useState(initialRatingCount);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleRate = async (newRating: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage('');

    try {
      const res = await fetch(`/api/recipes/${recipeId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: newRating }),
      });

      if (!res.ok) {
        throw new Error('별점 등록에 실패했습니다.');
      }

      const json = await res.json();
      setRating(json.data.rating);
      setRatingCount(json.data.ratingCount);
      setMessage('평가가 반영되었습니다!');
    } catch {
      setMessage('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#E8DFD0] bg-[#F5F0E8] p-6">
      <h2 className="mb-3 font-serif-title text-lg font-semibold text-[#3D2B1F]">평가하기</h2>
      <StarRating rating={rating} ratingCount={ratingCount} onRate={handleRate} />
      {message && (
        <p className="mt-2 text-sm text-[#6B7B3A]">{message}</p>
      )}
      {isSubmitting && (
        <p className="mt-2 text-sm text-[#9B8E7E]">처리 중...</p>
      )}
    </div>
  );
}
