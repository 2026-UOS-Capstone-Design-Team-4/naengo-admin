import { useEffect, useState } from 'react';

import {
  approveRecipe,
  getPendingRecipes,
  rejectRecipe,
  updateRecipe,
} from '@/api/recipes';
import { Recipe } from '@/components/RecipeCard';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
};

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

interface CardProps {
  recipe: Recipe;
  onApprove: (id: number) => void;
  onReject: (id: number, reason: string) => void;
  onUpdate: (id: number, data: Partial<Recipe>) => void;
}

function RecipeApprovalCard({ recipe, onApprove, onReject, onUpdate }: CardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<Recipe>>({});
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const thumbnail = recipe.video_url ? getYoutubeThumbnail(recipe.video_url) : null;
  const coverImage = thumbnail ?? recipe.image_url ?? null;

  function startEdit() {
    setDraft({
      title: recipe.title,
      description: recipe.description,
      ingredients_raw: recipe.ingredients_raw,
      instructions: recipe.instructions,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      calories: recipe.calories,
      difficulty: recipe.difficulty,
      tips: recipe.tips,
    });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({});
    setEditing(false);
  }

  function saveEdit() {
    onUpdate(recipe.id, draft);
    setEditing(false);
    setDraft({});
  }

  function handleReject() {
    if (!rejectReason.trim()) return;
    onReject(recipe.id, rejectReason);
    setRejecting(false);
    setRejectReason('');
  }

  return (
    <div className="flex h-[530px] w-80 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-(--color-light) bg-white shadow-sm">
      {/* 이미지 */}
      <div className="relative h-32 flex-shrink-0 bg-(--color-lighter)">
        {coverImage ? (
          <img src={coverImage} alt={recipe.title} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-(--color-light)">
            🍽
          </div>
        )}
        {/* 작성자 뱃지 */}
        {recipe.submitted_by && (
          <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            {recipe.submitted_by}
          </span>
        )}
        {/* 날짜 */}
        {recipe.created_at && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
            {new Date(recipe.created_at).toLocaleDateString('ko-KR')}
          </span>
        )}
      </div>

      {/* 본문 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 제목 + 수정아이콘 */}
        <div className="flex items-start gap-2 px-4 pt-3">
          {editing ? (
            <input
              className="flex-1 rounded-lg border border-(--color-light) px-2 py-1 text-sm font-semibold focus:border-(--color-main) focus:outline-none"
              value={draft.title ?? ''}
              onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
            />
          ) : (
            <p className="flex-1 font-semibold text-black leading-snug">{recipe.title}</p>
          )}
          {editing ? (
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={saveEdit}
                className="rounded-lg bg-(--color-main-ui) px-2 py-1 text-xs font-semibold text-white hover:bg-(--color-main)"
              >
                저장
              </button>
              <button
                onClick={cancelEdit}
                className="rounded-lg border border-(--color-light) px-2 py-1 text-xs text-(--color-gray) hover:bg-(--color-lighter)"
              >
                취소
              </button>
            </div>
          ) : (
            <button
              onClick={startEdit}
              className="flex-shrink-0 rounded-lg p-1 text-(--color-muted) hover:bg-(--color-lighter) hover:text-(--color-main)"
              title="수정"
            >
              ✏️
            </button>
          )}
        </div>

        {/* 메타 정보 */}
        <div className="flex gap-2 px-4 pt-1 flex-wrap">
          {editing ? (
            <>
              <select
                className="rounded border border-(--color-light) px-1 py-0.5 text-xs focus:outline-none"
                value={draft.difficulty ?? ''}
                onChange={e => setDraft(d => ({ ...d, difficulty: e.target.value }))}
              >
                <option value="easy">쉬움</option>
                <option value="normal">보통</option>
                <option value="hard">어려움</option>
              </select>
              <label className="flex items-center gap-0.5 text-xs">
                <input
                  type="number"
                  className="w-12 rounded border border-(--color-light) px-1 py-0.5 text-xs focus:outline-none"
                  placeholder="0"
                  value={draft.cooking_time ?? ''}
                  onChange={e => setDraft(d => ({ ...d, cooking_time: Number(e.target.value) }))}
                />
                분
              </label>
              <label className="flex items-center gap-0.5 text-xs">
                <input
                  type="number"
                  className="w-12 rounded border border-(--color-light) px-1 py-0.5 text-xs focus:outline-none"
                  placeholder="0"
                  value={draft.servings ?? ''}
                  onChange={e => setDraft(d => ({ ...d, servings: Number(e.target.value) }))}
                />
                인분
              </label>
              <label className="flex items-center gap-0.5 text-xs">
                <input
                  type="number"
                  className="w-12 rounded border border-(--color-light) px-1 py-0.5 text-xs focus:outline-none"
                  placeholder="0"
                  value={draft.calories ?? ''}
                  onChange={e => setDraft(d => ({ ...d, calories: Number(e.target.value) }))}
                />
                kcal
              </label>
            </>
          ) : (
            <div className="flex gap-2 text-xs text-(--color-muted)">
              {recipe.difficulty && <span>{DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}</span>}
              {recipe.cooking_time && <span>{recipe.cooking_time}분</span>}
              {recipe.servings && <span>{recipe.servings}인분</span>}
              {recipe.calories != null && <span>{recipe.calories}kcal</span>}
            </div>
          )}
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3 text-sm">
          {/* 설명 */}
          <div>
            <p className="mb-1 text-xs font-semibold text-(--color-main)">설명</p>
            {editing ? (
              <textarea
                className="w-full resize-none rounded-lg border border-(--color-light) px-2 py-1 text-xs focus:border-(--color-main) focus:outline-none"
                rows={2}
                value={draft.description ?? ''}
                onChange={e => setDraft(d => ({ ...d, description: e.target.value }))}
              />
            ) : (
              <p className="text-xs text-(--color-gray)">{recipe.description}</p>
            )}
          </div>

          {/* 재료 */}
          <div>
            <p className="mb-1 text-xs font-semibold text-(--color-main)">재료</p>
            {editing ? (
              <textarea
                className="w-full resize-none rounded-lg border border-(--color-light) px-2 py-1 text-xs focus:border-(--color-main) focus:outline-none"
                rows={3}
                value={draft.ingredients_raw ?? ''}
                onChange={e => setDraft(d => ({ ...d, ingredients_raw: e.target.value }))}
              />
            ) : (
              <p className="text-xs text-(--color-gray)">{recipe.ingredients_raw}</p>
            )}
          </div>

          {/* 조리 순서 */}
          <div>
            <p className="mb-1 text-xs font-semibold text-(--color-main)">조리 순서</p>
            {editing ? (
              <textarea
                className="w-full resize-none rounded-lg border border-(--color-light) px-2 py-1 text-xs focus:border-(--color-main) focus:outline-none"
                rows={4}
                value={(draft.instructions ?? []).join('\n')}
                onChange={e =>
                  setDraft(d => ({
                    ...d,
                    instructions: e.target.value.split('\n'),
                  }))
                }
                placeholder="한 줄에 한 단계씩"
              />
            ) : (
              <ol className="list-decimal pl-4 space-y-0.5 text-xs text-(--color-gray)">
                {recipe.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </div>

        </div>

        {/* 반려 사유 입력 */}
        {rejecting && (
          <div className="px-4 pb-2">
            <textarea
              className="w-full resize-none rounded-lg border border-red-300 px-2 py-1 text-xs focus:border-red-400 focus:outline-none"
              rows={2}
              placeholder="반려 사유를 입력하세요"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
        )}

        {/* 버튼 */}
        <div className="flex gap-2 border-t border-(--color-light) px-4 py-3">
          {rejecting ? (
            <>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim()}
                className="flex-1 rounded-full bg-red-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:bg-red-200"
              >
                반려 확정
              </button>
              <button
                onClick={() => { setRejecting(false); setRejectReason(''); }}
                className="flex-1 rounded-full border border-(--color-light) py-2 text-sm text-(--color-gray) hover:bg-(--color-lighter)"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setRejecting(true)}
                className="flex-1 rounded-full border border-red-300 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50"
              >
                반려
              </button>
              <button
                onClick={() => onApprove(recipe.id)}
                className="flex-1 rounded-full bg-(--color-main-ui) py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-main)"
              >
                승인
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPendingRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    });
  }, []);

  function handleApprove(id: number) {
    approveRecipe(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  }

  function handleReject(id: number, reason: string) {
    rejectRecipe(id, reason);
    setRecipes(prev => prev.filter(r => r.id !== id));
  }

  function handleUpdate(id: number, data: Partial<Recipe>) {
    updateRecipe(id, data);
    setRecipes(prev =>
      prev.map(r => (r.id === id ? { ...r, ...data } : r)),
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 border-b border-(--color-light) px-6 py-4">
        <p className="text-sm font-semibold text-(--color-gray)">승인 대기 레시피</p>
        {!loading && (
          <p className="mt-0.5 text-xs text-(--color-muted)">{recipes.length}개 대기 중</p>
        )}
      </div>

      {/* 카드 목록 (가로 스크롤) */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="animate-pulse text-sm text-(--color-muted)">불러오는 중...</p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-(--color-muted)">대기 중인 레시피가 없습니다.</p>
          </div>
        ) : (
          <div className="flex items-start gap-4 px-6 py-5">
            {recipes.map(recipe => (
              <RecipeApprovalCard
                key={recipe.id}
                recipe={recipe}
                onApprove={handleApprove}
                onReject={handleReject}
                onUpdate={handleUpdate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
