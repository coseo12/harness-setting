import RecipeForm from '@/components/RecipeForm';

/* 레시피 등록 페이지 — 어스톤 디자인 */
export default function NewRecipePage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif-title mb-6 text-3xl font-bold text-[#3D2B1F]">
        새 레시피 등록
      </h1>
      <div className="rounded-xl border border-[#E8DFD0] bg-[#FFFBF0] p-6">
        <RecipeForm />
      </div>
    </div>
  );
}
