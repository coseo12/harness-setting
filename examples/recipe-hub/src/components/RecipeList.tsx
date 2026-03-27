import RecipeCard from './RecipeCard';
import { Recipe } from '@/data/recipes';

interface RecipeListProps {
  recipes: Recipe[];
}

// 레시피 카드 그리드 컴포넌트 - 반응형 레이아웃 지원
export default function RecipeList({ recipes }: RecipeListProps) {
  if (recipes.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-lg text-gray-500">레시피가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <RecipeCard key={recipe.id} recipe={recipe} />
      ))}
    </div>
  );
}
