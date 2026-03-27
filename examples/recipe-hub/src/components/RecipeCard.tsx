import Link from 'next/link';
import StarRating from './StarRating';
import { Recipe } from '@/data/recipes';

interface RecipeCardProps {
  recipe: Recipe;
}

/* 레시피 카드 컴포넌트 — 어스톤 미니멀 디자인 */
export default function RecipeCard({ recipe }: RecipeCardProps) {
  return (
    <Link href={`/recipes/${recipe.id}`}>
      <div className="group overflow-hidden rounded-xl border border-[#E8DFD0] bg-[#FFFBF0] transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        {/* 레시피 이미지 */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>

        <div className="p-5">
          {/* 카테고리 뱃지 */}
          <span className="inline-block rounded-full bg-[#6B7B3A]/10 px-2.5 py-0.5 text-xs font-medium text-[#6B7B3A]">
            {recipe.category}
          </span>

          {/* 제목 */}
          <h3 className="mt-2 font-serif-title text-lg font-semibold text-[#3D2B1F]">
            {recipe.title}
          </h3>

          {/* 설명 */}
          <p className="mt-1 line-clamp-2 text-sm text-[#9B8E7E]">
            {recipe.description}
          </p>

          {/* 별점 */}
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
