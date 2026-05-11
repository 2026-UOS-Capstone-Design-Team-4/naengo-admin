import axios from 'axios';
import { useEffect, useState } from 'react';

import {
  approvePendingRecipe,
  approvePendingRecipeWithData,
  getMissingFieldLabels,
  getPendingRecipes,
  PendingRecipeUpdatePayload,
  rejectPendingRecipe,
  updatePendingRecipe,
} from '@/api/recipes';
import { PendingRecipe } from '@/components/RecipeCard';

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
};

const INGREDIENT_UNITS = [
  '큰술',
  '작은술',
  '스푼',
  '꼬집',
  '컵',
  '공기',
  '봉지',
  '봉',
  '팩',
  '캔',
  '개',
  '쪽',
  '장',
  '줄기',
  '줌',
  '알',
  '마리',
  'g',
  'kg',
  'ml',
  'L',
];

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = (error.response?.data as { detail?: unknown } | undefined)
      ?.detail;
    if (typeof detail === 'string') return detail;
  }
  return fallback;
}

function parseIngredientsRaw(ingredientsRaw: string | null | undefined) {
  return (ingredientsRaw ?? '')
    .split(/\n|,/)
    .map(line => line.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean)
    .map(line => {
      const tokens = line.split(/\s+/);
      const amountWithUnitPattern = new RegExp(
        `^(\\d+([./]\\d+)?)(${INGREDIENT_UNITS.join('|')})$`,
      );
      const amountIndex = tokens.findIndex(token => {
        return (
          /^(\d+([./]\d+)?|약간|조금|적당량)$/.test(token) ||
          amountWithUnitPattern.test(token)
        );
      });
      const amountToken = amountIndex >= 0 ? tokens[amountIndex] : '';
      const attachedAmount = amountToken.match(amountWithUnitPattern);
      const unitIndex =
        amountIndex >= 0 &&
        INGREDIENT_UNITS.includes(tokens[amountIndex + 1] ?? '')
          ? amountIndex + 1
          : -1;

      if (amountIndex > 0) {
        return {
          name: tokens.slice(0, amountIndex).join(' '),
          amount: attachedAmount?.[1] ?? amountToken,
          unit: attachedAmount?.[3] ?? (unitIndex > 0 ? tokens[unitIndex] : '적당량'),
          type: 'main',
          note: unitIndex > 0 ? tokens.slice(unitIndex + 1).join(' ') : '',
        };
      }

      return {
        name: line,
        amount: '적당량',
        unit: '적당량',
        type: 'main',
        note: null,
      };
    });
}

function readTextCandidate(
  recipe: PendingRecipe,
  keys: string[],
): string | string[] | null {
  for (const key of keys) {
    const value = recipe[key];
    if (typeof value === 'string' && value.trim()) return value;
    if (Array.isArray(value) && value.length > 0) {
      return value.map(item =>
        typeof item === 'string' ? item : JSON.stringify(item),
      );
    }
  }
  return null;
}

function normalizeInstructionSteps(
  instructions: string[] | string | null | undefined,
) {
  const lines = Array.isArray(instructions)
    ? instructions
    : (instructions ?? '').split('\n');

  return lines
    .map(step => step.replace(/^[-*•\d.)\s]+/, '').trim())
    .filter(Boolean);
}

function getRecipeInstructionSource(recipe: PendingRecipe) {
  return readTextCandidate(recipe, [
    'instructions',
    'instruction',
    'cooking_steps',
    'cooking_step',
    'steps',
    'recipe_steps',
    'recipeSteps',
    'content',
  ]);
}

function normalizeRecipeDraft(
  draft: PendingRecipeUpdatePayload,
): PendingRecipeUpdatePayload {
  const ingredientsRaw = draft.ingredients_raw?.trim() ?? '';
  const instructions = normalizeInstructionSteps(draft.instructions);

  return {
    ...draft,
    ingredients_raw: ingredientsRaw || null,
    ingredients: ingredientsRaw
      ? parseIngredientsRaw(ingredientsRaw)
      : (draft.ingredients ?? null),
    instructions: instructions.length > 0 ? instructions : null,
    content: instructions.length > 0 ? instructions.join('\n') : draft.content,
  };
}

interface CardProps {
  recipe: PendingRecipe;
  onApprove: (
    id: number,
    data?: PendingRecipeUpdatePayload,
  ) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
  onUpdate: (id: number, data: PendingRecipeUpdatePayload) => Promise<void>;
}

function RecipeApprovalCard({
  recipe,
  onApprove,
  onReject,
  onUpdate,
}: CardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PendingRecipeUpdatePayload>({});
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const thumbnail = recipe.video_url
    ? getYoutubeThumbnail(recipe.video_url)
    : null;
  const coverImage = thumbnail ?? recipe.image_url ?? null;

  const missingLabels = getMissingFieldLabels(recipe);
  const canApprove = missingLabels.length === 0 && !submitting;
  const instructionSource = getRecipeInstructionSource(recipe);
  const visibleInstructions = normalizeInstructionSteps(instructionSource);

  function startEdit() {
    setDraft({
      title: recipe.title,
      content: recipe.content,
      description: recipe.description,
      ingredients: recipe.ingredients,
      ingredients_raw: recipe.ingredients_raw,
      instructions: visibleInstructions,
      cooking_time: recipe.cooking_time,
      servings: recipe.servings,
      calories: recipe.calories,
      difficulty: recipe.difficulty,
      category: recipe.category,
      tips: recipe.tips,
    });
    setEditing(true);
  }

  function cancelEdit() {
    setDraft({});
    setEditing(false);
  }

  async function saveEdit() {
    setSubmitting(true);
    try {
      await onUpdate(recipe.pending_recipe_id, normalizeRecipeDraft(draft));
      setEditing(false);
      setDraft({});
    } finally {
      setSubmitting(false);
    }
  }

  async function handleApproveClick() {
    if (!canApprove) return;
    setSubmitting(true);
    try {
      await onApprove(
        recipe.pending_recipe_id,
        normalizeRecipeDraft({
          title: recipe.title,
          content: recipe.content,
          description: recipe.description,
          ingredients: recipe.ingredients,
          instructions: visibleInstructions,
          ingredients_raw: recipe.ingredients_raw,
          servings: recipe.servings,
          cooking_time: recipe.cooking_time,
          calories: recipe.calories,
          difficulty: recipe.difficulty,
          category: recipe.category,
          tags: recipe.tags,
          tips: recipe.tips,
          video_url: recipe.video_url,
          image_url: recipe.image_url,
        }),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRejectConfirm() {
    if (!rejectReason.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onReject(recipe.pending_recipe_id, rejectReason);
      setRejecting(false);
      setRejectReason('');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex h-[530px] w-80 flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-(--color-light) bg-white shadow-sm">
      {/* 이미지 */}
      <div className="relative h-32 flex-shrink-0 bg-(--color-lighter)">
        {coverImage ? (
          <img
            src={coverImage}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-4xl text-(--color-light)">
            🍽
          </div>
        )}
        {/* 상태 뱃지 */}
        <span className="absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
          {recipe.status}
        </span>
        {/* 날짜 */}
        {recipe.created_at && (
          <span className="absolute right-2 bottom-2 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white">
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
            <p className="flex-1 leading-snug font-semibold text-black">
              {recipe.title}
            </p>
          )}
          {editing ? (
            <div className="flex flex-shrink-0 gap-1">
              <button
                onClick={saveEdit}
                disabled={submitting}
                className="rounded-lg bg-(--color-main-ui) px-2 py-1 text-xs font-semibold text-white hover:bg-(--color-main) disabled:opacity-50"
              >
                저장
              </button>
              <button
                onClick={cancelEdit}
                disabled={submitting}
                className="rounded-lg border border-(--color-light) px-2 py-1 text-xs text-(--color-gray) hover:bg-(--color-lighter) disabled:opacity-50"
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
        <div className="flex flex-wrap gap-2 px-4 pt-1">
          {editing ? (
            <>
              <select
                className="rounded border border-(--color-light) px-1 py-0.5 text-xs focus:outline-none"
                value={draft.difficulty ?? ''}
                onChange={e =>
                  setDraft(d => ({
                    ...d,
                    difficulty: (e.target.value ||
                      null) as PendingRecipeUpdatePayload['difficulty'],
                  }))
                }
              >
                <option value="">선택</option>
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
                  onChange={e =>
                    setDraft(d => ({
                      ...d,
                      cooking_time: Number(e.target.value),
                    }))
                  }
                />
                분
              </label>
              <label className="flex items-center gap-0.5 text-xs">
                <input
                  type="number"
                  className="w-12 rounded border border-(--color-light) px-1 py-0.5 text-xs focus:outline-none"
                  placeholder="0"
                  value={draft.servings ?? ''}
                  onChange={e =>
                    setDraft(d => ({ ...d, servings: Number(e.target.value) }))
                  }
                />
                인분
              </label>
              <label className="flex items-center gap-0.5 text-xs">
                <input
                  type="number"
                  className="w-12 rounded border border-(--color-light) px-1 py-0.5 text-xs focus:outline-none"
                  placeholder="0"
                  value={draft.calories ?? ''}
                  onChange={e =>
                    setDraft(d => ({ ...d, calories: Number(e.target.value) }))
                  }
                />
                kcal
              </label>
              <label className="flex items-center gap-0.5 text-xs">
                <input
                  type="text"
                  className="w-24 rounded border border-(--color-light) px-1 py-0.5 text-xs focus:outline-none"
                  placeholder="카테고리"
                  value={(draft.category ?? []).join(', ')}
                  onChange={e =>
                    setDraft(d => ({
                      ...d,
                      category: e.target.value
                        .split(',')
                        .map(category => category.trim())
                        .filter(Boolean),
                    }))
                  }
                />
              </label>
            </>
          ) : (
            <div className="flex gap-2 text-xs text-(--color-muted)">
              {recipe.difficulty && (
                <span>
                  {DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}
                </span>
              )}
              {recipe.cooking_time != null && (
                <span>{recipe.cooking_time}분</span>
              )}
              {recipe.servings != null && <span>{recipe.servings}인분</span>}
              {recipe.calories != null && <span>{recipe.calories}kcal</span>}
            </div>
          )}
        </div>

        {/* 스크롤 영역 */}
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-2 text-sm">
          {/* 설명 */}
          <div>
            <p className="mb-1 text-xs font-semibold text-(--color-main)">
              설명
            </p>
            {editing ? (
              <textarea
                className="w-full resize-none rounded-lg border border-(--color-light) px-2 py-1 text-xs focus:border-(--color-main) focus:outline-none"
                rows={2}
                value={draft.description ?? ''}
                onChange={e =>
                  setDraft(d => ({ ...d, description: e.target.value }))
                }
              />
            ) : (
              <p className="text-xs text-(--color-gray)">
                {recipe.description}
              </p>
            )}
          </div>

          {/* 재료 */}
          <div>
            <p className="mb-1 text-xs font-semibold text-(--color-main)">
              재료
            </p>
            {editing ? (
              <textarea
                className="w-full resize-none rounded-lg border border-(--color-light) px-2 py-1 text-xs focus:border-(--color-main) focus:outline-none"
                rows={3}
                value={draft.ingredients_raw ?? ''}
                onChange={e =>
                  setDraft(d => ({ ...d, ingredients_raw: e.target.value }))
                }
              />
            ) : (
              <p className="text-xs text-(--color-gray)">
                {recipe.ingredients_raw}
              </p>
            )}
          </div>

          {/* 조리 순서 */}
          <div>
            <p className="mb-1 text-xs font-semibold text-(--color-main)">
              조리 순서
            </p>
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
              <>
                {visibleInstructions.length > 0 ? (
                  <ol className="list-decimal space-y-0.5 pl-4 text-xs text-(--color-gray)">
                    {visibleInstructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-xs text-(--color-muted)">
                    조리 순서가 없습니다.
                  </p>
                )}
              </>
            )}
          </div>
        </div>

        {/* 승인 불가 사유 안내 */}
        {!editing && !rejecting && missingLabels.length > 0 && (
          <div className="mx-4 mb-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
            <span className="font-semibold">승인 전 입력 필요: </span>
            {missingLabels.join(', ')}
          </div>
        )}

        {/* 반려 사유 입력 */}
        {rejecting && (
          <div className="px-4 pb-2">
            <textarea
              className="w-full resize-none rounded-lg border border-red-300 px-2 py-1 text-xs focus:border-red-400 focus:outline-none"
              rows={2}
              placeholder="반려 사유를 입력하세요 (관리자 메모로 저장됨)"
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
                onClick={handleRejectConfirm}
                disabled={!rejectReason.trim() || submitting}
                className="flex-1 rounded-full bg-red-500 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:bg-red-200"
              >
                반려 확정
              </button>
              <button
                onClick={() => {
                  setRejecting(false);
                  setRejectReason('');
                }}
                disabled={submitting}
                className="flex-1 rounded-full border border-(--color-light) py-2 text-sm text-(--color-gray) hover:bg-(--color-lighter) disabled:opacity-50"
              >
                취소
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setRejecting(true)}
                disabled={submitting}
                className="flex-1 rounded-full border border-red-300 py-2 text-sm font-semibold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                반려
              </button>
              <button
                onClick={handleApproveClick}
                disabled={!canApprove}
                title={
                  !canApprove && missingLabels.length > 0
                    ? `누락: ${missingLabels.join(', ')}`
                    : undefined
                }
                className="flex-1 rounded-full bg-(--color-main-ui) py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-main) disabled:bg-(--color-muted)"
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
  const [recipes, setRecipes] = useState<PendingRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPendingRecipes()
      .then(data => {
        if (cancelled) return;
        // PENDING 상태만 큐에 노출 (API 가 다른 상태도 같이 줄 가능성 대비)
        setRecipes(data.filter(r => r.status === 'PENDING'));
        setLoading(false);
      })
      .catch(error => {
        if (cancelled) return;
        setErrorMessage(
          extractErrorMessage(error, '제출 레시피 목록을 불러오지 못했습니다.'),
        );
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function removeFromList(id: number) {
    setRecipes(prev => prev.filter(r => r.pending_recipe_id !== id));
  }

  async function handleApprove(id: number, data?: PendingRecipeUpdatePayload) {
    setErrorMessage(null);
    try {
      await (data
        ? approvePendingRecipeWithData(id, data)
        : approvePendingRecipe(id));
      removeFromList(id);
    } catch (error) {
      // 400 = 필수 필드 누락, 그 외는 일반 실패
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : undefined;
      setErrorMessage(
        extractErrorMessage(
          error,
          status === 400
            ? '승인에 필요한 필수 필드가 부족합니다.'
            : '승인 실패',
        ),
      );
    }
  }

  async function handleReject(id: number, reason: string) {
    setErrorMessage(null);
    try {
      await rejectPendingRecipe(id, reason);
      removeFromList(id);
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, '반려 실패'));
    }
  }

  async function handleUpdate(id: number, data: PendingRecipeUpdatePayload) {
    setErrorMessage(null);
    try {
      const updated = await updatePendingRecipe(id, data);
      // 백엔드가 돌려준 최신 값으로 카드 갱신 (낙관적 업데이트 대신 진실값 사용)
      setRecipes(prev =>
        prev.map(r => (r.pending_recipe_id === id ? updated : r)),
      );
    } catch (error) {
      setErrorMessage(extractErrorMessage(error, '수정 실패'));
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 헤더 */}
      <div className="flex-shrink-0 border-b border-(--color-light) px-6 py-4">
        <p className="text-sm font-semibold text-(--color-gray)">
          승인 대기 레시피
        </p>
        {!loading && (
          <p className="mt-0.5 text-xs text-(--color-muted)">
            {recipes.length}개 대기 중
          </p>
        )}
        {errorMessage && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-1.5 text-xs text-red-500">
            {errorMessage}
          </p>
        )}
      </div>

      {/* 카드 목록 (가로 스크롤) */}
      <div className="flex-1 overflow-x-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="animate-pulse text-sm text-(--color-muted)">
              불러오는 중...
            </p>
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-(--color-muted)">
              대기 중인 레시피가 없습니다.
            </p>
          </div>
        ) : (
          <div className="flex items-start gap-4 px-6 py-5">
            {recipes.map(recipe => (
              <RecipeApprovalCard
                key={recipe.pending_recipe_id}
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
