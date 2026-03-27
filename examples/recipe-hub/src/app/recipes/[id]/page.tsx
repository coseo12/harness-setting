import Image from 'next/image';
import Link from 'next/link';
import { recipes, Recipe } from '@/data/recipes';
import { notFound } from 'next/navigation';
import RatingSection from './RatingSection';

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe: Recipe | undefined = recipes.find((r) => r.id === id);

  if (!recipe) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 반응형: 모바일 세로, 데스크톱 좌우 분할 */}
      <div className="flex flex-col gap-8 lg:flex-row">
        {/* 왼쪽: 이미지 */}
        <div className="w-full lg:w-1/2">
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl">
            <Image
              src={recipe.imageUrl}
              alt={recipe.title}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
        </div>

        {/* 오른쪽: 정보 */}
        <div className="flex flex-1 flex-col gap-6">
          {/* 카테고리 뱃지 */}
          <span className="inline-block w-fit rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
            {recipe.category}
          </span>

          {/* 제목 */}
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {recipe.title}
          </h1>

          {/* 설명 */}
          <p className="text-gray-600">{recipe.description}</p>

          {/* 별점 (인터랙티브) */}
          <RatingSection
            recipeId={recipe.id}
            initialRating={recipe.rating}
            initialRatingCount={recipe.ratingCount}
          />
        </div>
      </div>

      {/* 재료 목록 */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">재료</h2>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {recipe.ingredients.map((ingredient, index) => (
            <li key={index} className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`ingredient-${index}`}
                className="h-4 w-4 rounded border-gray-300 text-orange-500 accent-orange-500"
              />
              <label
                htmlFor={`ingredient-${index}`}
                className="text-gray-700 select-none"
              >
                {ingredient}
              </label>
            </li>
          ))}
        </ul>
      </section>

      {/* 조리 순서 */}
      <section className="mt-10">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">조리 순서</h2>
        <ol className="space-y-4">
          {recipe.steps.map((step, index) => (
            <li key={index} className="flex gap-4">
              {/* 순서 번호 */}
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
                {index + 1}
              </span>
              <p className="pt-1 text-gray-700">{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 목록으로 돌아가기 */}
      <div className="mt-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <svg
            className="h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          목록으로
        </Link>
      </div>
    </div>
  );
}
