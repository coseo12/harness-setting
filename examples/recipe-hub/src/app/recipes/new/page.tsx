import RecipeForm from '@/components/RecipeForm';

// 레시피 등록 페이지
export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900 sm:text-3xl">
        새 레시피 등록
      </h1>
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <RecipeForm />
      </div>
    </div>
  );
}
