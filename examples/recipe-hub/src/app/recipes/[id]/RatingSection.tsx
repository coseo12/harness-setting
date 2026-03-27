'use client';

import { useState } from 'react';
import StarRating from '@/components/StarRating';

interface RatingSectionProps {
  recipeId: string;
  initialRating: number;
  initialRatingCount: number;
}

// 별점 인터랙션 섹션 - 클릭 시 API로 별점 전송
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
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-900">평가하기</h2>
      <StarRating rating={rating} ratingCount={ratingCount} onRate={handleRate} />
      {message && (
        <p className="mt-2 text-sm text-green-600">{message}</p>
      )}
      {isSubmitting && (
        <p className="mt-2 text-sm text-gray-500">처리 중...</p>
      )}
    </div>
  );
}
