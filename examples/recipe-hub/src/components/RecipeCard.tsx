import Link from 'next/link';
import Image from 'next/image';
import StarRating from './StarRating';
import { Recipe } from '@/data/recipes';

interface RecipeCardProps {
  recipe: Recipe;
}

// 레시피 카드 컴포넌트 - 목록에서 개별 레시피를 표시
export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <div className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-lg">
        {/* 레시피 이미지 */}
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>

        <div className="p-4">
          {/* 카테고리 뱃지 */}
          <span className="inline-block rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            {recipe.category}
          </span>

          {/* 제목 */}
          <h3 className="mt-2 text-lg font-semibold text-gray-900">
            {recipe.title}
          </h3>

          {/* 설명 - 2줄 말줄임 */}
          <p className="mt-1 line-clamp-2 text-sm text-gray-600">
            {recipe.description}
          </p>

          {/* 별점 (readonly) */}
          <div className="mt-3">
            <StarRating
              rating={recipe.rating}
              ratingCount={recipe.ratingCount}
              readonly
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
