'use client';

interface StarRatingProps {
  rating: number;
  ratingCount: number;
  onRate?: (rating: number) => void;
  readonly?: boolean;
}

// 별점 표시 컴포넌트 - 채워진 별(노란색)과 빈 별(회색) 표시
export default function StarRating({
  rating,
  ratingCount,
  onRate,
  readonly = false,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const handleClick = (star: number) => {
    if (readonly || !onRate) return;
    onRate(star);
  };

  return (
    <div className="flex items-center gap-1">
      {stars.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => handleClick(star)}
          disabled={readonly}
          className={`text-lg ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}`}
          aria-label={`${star}점`}
        >
          {/* 현재 rating 이하이면 채워진 별, 초과이면 빈 별 */}
          <svg
            className={`h-5 w-5 ${star <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
          </svg>
        </button>
      ))}
      <span className="ml-1 text-sm text-gray-500">({ratingCount}개 평가)</span>
    </div>
  );
}
