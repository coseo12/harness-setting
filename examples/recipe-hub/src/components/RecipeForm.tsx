'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 카테고리 옵션
const CATEGORY_OPTIONS = ['찌개', '볶음', '밥', '면', '구이', '기타'];

// 레시피 등록 폼 컴포넌트
export default function RecipeForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 폼 필드 상태
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [stepInput, setStepInput] = useState('');
  const [steps, setSteps] = useState<string[]>([]);

  // 재료 추가
  const addIngredient = () => {
    const trimmed = ingredientInput.trim();
    if (!trimmed) return;
    setIngredients((prev) => [...prev, trimmed]);
    setIngredientInput('');
  };

  // 재료 삭제
  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // 조리 단계 추가
  const addStep = () => {
    const trimmed = stepInput.trim();
    if (!trimmed) return;
    setSteps((prev) => [...prev, trimmed]);
    setStepInput('');
  };

  // 조리 단계 삭제
  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !description || !category) {
      setError('제목, 설명, 카테고리는 필수 항목입니다.');
      return;
    }
    if (ingredients.length === 0) {
      setError('최소 1개의 재료를 추가해주세요.');
      return;
    }
    if (steps.length === 0) {
      setError('최소 1개의 조리 단계를 추가해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          imageUrl: imageUrl || undefined,
          ingredients,
          steps,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || '레시피 등록에 실패했습니다.');
      }

      // 등록 완료 후 홈으로 이동
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-shadow focus:border-orange-400 focus:ring-2 focus:ring-orange-200';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 에러 메시지 */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 제목 */}
      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
          제목 *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="레시피 제목"
          className={inputClass}
        />
      </div>

      {/* 설명 */}
      <div>
        <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
          설명 *
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="레시피에 대한 간단한 설명"
          rows={3}
          className={inputClass}
        />
      </div>

      {/* 카테고리 */}
      <div>
        <label htmlFor="category" className="mb-1 block text-sm font-medium text-gray-700">
          카테고리 *
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="">카테고리 선택</option>
          {CATEGORY_OPTIONS.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 이미지 URL (선택) */}
      <div>
        <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-gray-700">
          이미지 URL (선택)
        </label>
        <input
          id="imageUrl"
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className={inputClass}
        />
      </div>

      {/* 재료 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          재료 *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addIngredient();
              }
            }}
            placeholder="재료를 입력하고 추가 버튼을 누르세요"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addIngredient}
            className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            추가
          </button>
        </div>
        {/* 추가된 재료 목록 */}
        {ingredients.length > 0 && (
          <ul className="mt-2 space-y-1">
            {ingredients.map((item, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-1.5 text-sm"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => removeIngredient(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 조리 순서 */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          조리 순서 *
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={stepInput}
            onChange={(e) => setStepInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addStep();
              }
            }}
            placeholder="조리 단계를 입력하고 추가 버튼을 누르세요"
            className={inputClass}
          />
          <button
            type="button"
            onClick={addStep}
            className="shrink-0 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
          >
            추가
          </button>
        </div>
        {/* 추가된 조리 단계 */}
        {steps.length > 0 && (
          <ol className="mt-2 space-y-1">
            {steps.map((step, index) => (
              <li
                key={index}
                className="flex items-center justify-between rounded-md bg-gray-100 px-3 py-1.5 text-sm"
              >
                <span>
                  <strong>{index + 1}.</strong> {step}
                </span>
                <button
                  type="button"
                  onClick={() => removeStep(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  삭제
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* 제출 버튼 */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-orange-500 py-2.5 text-sm font-medium text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
      >
        {isSubmitting ? '등록 중...' : '레시피 등록'}
      </button>
    </form>
  );
}
