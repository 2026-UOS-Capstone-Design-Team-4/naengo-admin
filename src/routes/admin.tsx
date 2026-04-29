import axios from 'axios';
import { useState } from 'react';

import { getRecipeByVideoUrl } from '@/api/recipes';
import { Recipe, RecipeCard } from '@/components/RecipeCard';

type RecipeResult =
  | { status: 'found'; data: Recipe }
  | { status: 'not_found' }
  | { status: 'error' };

export default function AdminPage() {
  const [videoUrl, setVideoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RecipeResult | null>(null);

  const handleCheck = async () => {
    if (!videoUrl.trim() || isLoading) return;
    setIsLoading(true);
    setResult(null);

    try {
      const data = await getRecipeByVideoUrl(videoUrl.trim());
      setResult({ status: 'found', data });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        setResult({ status: 'not_found' });
      } else {
        setResult({ status: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <p className="mb-3 text-sm font-semibold text-(--color-gray)">
        YouTube URL로 레시피 조회
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-full border border-(--color-light) bg-(--color-lightest) px-4 py-2 text-black focus:border-(--color-main) focus:outline-none"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={e => setVideoUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCheck()}
        />
        <button
          onClick={handleCheck}
          disabled={isLoading}
          className="rounded-full bg-(--color-main-ui) px-6 py-2 font-semibold text-white transition-colors hover:bg-(--color-main) disabled:bg-(--color-muted)"
        >
          조회
        </button>
      </div>

      {isLoading && (
        <p className="mt-4 animate-pulse text-sm text-(--color-muted)">
          조회 중...
        </p>
      )}

      {result?.status === 'not_found' && (
        <div className="mt-4 rounded-2xl border border-(--color-light) bg-(--color-lightest) px-4 py-3 text-sm text-(--color-gray)">
          DB에 등록되지 않은 레시피예요.
        </div>
      )}

      {result?.status === 'error' && (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-500">
          조회 중 오류가 발생했습니다.
        </div>
      )}

      {result?.status === 'found' && (
        <div className="mt-4">
          <div className="mb-2 flex items-center gap-3 text-xs text-(--color-gray)">
            <span className="font-semibold text-(--color-gray)">DB에 등록된 레시피예요.</span>
            <span
              className={`rounded-full px-2 py-0.5 font-semibold ${
                result.data.is_active
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-500'
              }`}
            >
              {result.data.is_active ? '활성' : '비활성'}
            </span>
            {result.data.author_type && (
              <span className="rounded-full bg-(--color-light) px-2 py-0.5">
                {result.data.author_type}
              </span>
            )}
            {result.data.created_at && (
              <span>{new Date(result.data.created_at).toLocaleDateString('ko-KR')}</span>
            )}
          </div>
          <RecipeCard recipe={result.data} />
        </div>
      )}
    </div>
  );
}
