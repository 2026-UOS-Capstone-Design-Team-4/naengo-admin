import { RefreshCw, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/api/client';
import {
  changePendingRecipeStatus,
  getMissingFieldLabels,
  getPendingRecipes,
  hardDeletePendingRecipe,
} from '@/api/recipes';
import {
  PendingRecipe,
  PendingRecipeStatus,
} from '@/components/RecipeCard';

const STATUS_FILTERS: Array<{
  label: string;
  value: PendingRecipeStatus | '';
}> = [
  { label: '전체', value: '' },
  { label: '대기', value: 'PENDING' },
  { label: '승인', value: 'APPROVED' },
  { label: '거절', value: 'REJECTED' },
];

const ACTIVE_FILTERS: Array<{ label: string; value: boolean | '' }> = [
  { label: '활성', value: true },
  { label: '삭제됨', value: false },
  { label: '전체', value: '' },
];

const STATUS_LABEL: Record<PendingRecipeStatus, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

const IMPORT_STATUS_LABEL: Record<string, string> = {
  NOT_IMPORTED: '미임포트',
  IMPORTED: '임포트 완료',
  FAILED: '임포트 실패',
};

const STATUS_BADGE_CLASS: Record<PendingRecipeStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
};

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function PendingRecipeCard({
  recipe,
  onChangeStatus,
  onHardDelete,
  busy,
}: {
  recipe: PendingRecipe;
  onChangeStatus: (
    id: number,
    status: PendingRecipeStatus,
    reason?: string,
  ) => void;
  onHardDelete: (id: number) => void;
  busy: boolean;
}) {
  const [reason, setReason] = useState('');
  const [nextStatus, setNextStatus] = useState<PendingRecipeStatus>(
    recipe.status,
  );

  const missingLabels = getMissingFieldLabels(recipe);
  const isImportReady = missingLabels.length === 0;

  useEffect(() => {
    setNextStatus(recipe.status);
  }, [recipe.status]);

  return (
    <article className="flex h-full min-h-96 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* Card header */}
      <div className="border-b border-slate-100 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold text-slate-400">
              #{recipe.user_recipe_id} · user {recipe.user_id}
            </p>
            <h2 className="mt-0.5 line-clamp-2 font-bold text-slate-900">
              {recipe.title}
            </h2>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASS[recipe.status]}`}
            >
              {STATUS_LABEL[recipe.status]}
            </span>
            {!recipe.is_active && (
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-500">
                삭제됨
              </span>
            )}
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                isImportReady
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                  : 'bg-slate-50 text-slate-500 ring-slate-200'
              }`}
            >
              {IMPORT_STATUS_LABEL[recipe.import_status] ??
                recipe.import_status}
            </span>
          </div>
        </div>
        {recipe.reviewed_at && (
          <p className="mt-1.5 text-[10px] text-slate-400">
            검토: {formatDate(recipe.reviewed_at)}
            {recipe.reviewed_by && ` · by #${recipe.reviewed_by}`}
          </p>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {/* 이미지 */}
        {recipe.main_image_url && (
          <img
            src={recipe.main_image_url}
            alt={recipe.title}
            className="aspect-video w-full rounded-lg object-cover"
          />
        )}

        {/* 설명 */}
        {recipe.description && (
          <p className="text-xs leading-5 whitespace-pre-wrap text-slate-600">
            {recipe.description}
          </p>
        )}

        {/* 기본 정보 */}
        <div className="grid grid-cols-2 gap-2">
          {recipe.servings != null && (
            <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-slate-400">인분</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                {recipe.servings}
              </p>
            </div>
          )}
          {recipe.cooking_time_minutes != null && (
            <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-slate-400">
                조리 시간
              </p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                {recipe.cooking_time_minutes}분
              </p>
            </div>
          )}
          {recipe.kcal_per_serving != null && (
            <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-slate-400">칼로리</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                {recipe.kcal_per_serving}kcal
              </p>
            </div>
          )}
          {recipe.difficulty && (
            <div className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1.5">
              <p className="text-[10px] font-semibold text-slate-400">난이도</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-800">
                {DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}
              </p>
            </div>
          )}
        </div>

        {/* 카테고리 / 태그 */}
        {(recipe.category.length > 0 || recipe.tags.length > 0) && (
          <div className="flex flex-wrap gap-1">
            {recipe.category.map(cat => (
              <span
                key={cat}
                className="rounded-full bg-(--color-lighter) px-2 py-0.5 text-[10px] font-semibold text-(--color-main-ui) ring-1 ring-(--color-light)"
              >
                {cat}
              </span>
            ))}
            {recipe.tags.map(tag => (
              <span
                key={tag}
                className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* 재료 */}
        {recipe.ingredients.length > 0 && (
          <section className="rounded-lg border border-slate-200">
            <h3 className="border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
              재료
            </h3>
            <div>
              {recipe.ingredients.map((ingredient, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto] border-b border-slate-100 px-3 py-1.5 text-xs last:border-0"
                >
                  <span className="text-slate-800">
                    {ingredient.name}
                    {ingredient.is_optional && (
                      <span className="ml-1 text-slate-400">(선택)</span>
                    )}
                  </span>
                  <span className="text-slate-500">
                    {ingredient.amount_text || ''}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 조리 순서 */}
        {recipe.steps.length > 0 && (
          <section>
            <h3 className="mb-1.5 text-xs font-semibold text-slate-700">
              조리 순서
            </h3>
            <ol className="space-y-1.5">
              {recipe.steps.map(step => (
                <li
                  key={step.step_no}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
                >
                  <p className="font-semibold text-slate-500">
                    Step {step.step_no}
                  </p>
                  <p className="mt-0.5 leading-5 text-slate-800">
                    {step.instruction}
                  </p>
                  {step.tip && (
                    <p className="mt-0.5 text-slate-400 italic">
                      Tip: {step.tip}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* 팁 / 주의사항 */}
        {(recipe.tips.length > 0 || recipe.warnings.length > 0) && (
          <section className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
            {recipe.tips.length > 0 && (
              <>
                <p className="text-[10px] font-semibold text-slate-500">팁</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-slate-600">
                  {recipe.tips.map((tip, i) => (
                    <li key={i}>{tip}</li>
                  ))}
                </ul>
              </>
            )}
            {recipe.warnings.length > 0 && (
              <div className={recipe.tips.length > 0 ? 'mt-2' : ''}>
                <p className="text-[10px] font-semibold text-slate-500">
                  주의사항
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs text-amber-700">
                  {recipe.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        {/* 영양 정보 */}
        {recipe.nutrition && (
          <section className="rounded-lg border border-slate-200 px-3 py-2.5">
            <p className="mb-1.5 text-[10px] font-semibold text-slate-500">
              영양 정보
            </p>
            <div className="grid grid-cols-2 gap-2">
              {recipe.nutrition.carbohydrate_grams != null && (
                <div className="rounded bg-slate-50 px-2 py-1">
                  <p className="text-[10px] text-slate-400">탄수화물</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {recipe.nutrition.carbohydrate_grams}g
                  </p>
                </div>
              )}
              {recipe.nutrition.protein_grams != null && (
                <div className="rounded bg-slate-50 px-2 py-1">
                  <p className="text-[10px] text-slate-400">단백질</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {recipe.nutrition.protein_grams}g
                  </p>
                </div>
              )}
              {recipe.nutrition.fat_grams != null && (
                <div className="rounded bg-slate-50 px-2 py-1">
                  <p className="text-[10px] text-slate-400">지방</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {recipe.nutrition.fat_grams}g
                  </p>
                </div>
              )}
              {recipe.nutrition.sodium_milligrams != null && (
                <div className="rounded bg-slate-50 px-2 py-1">
                  <p className="text-[10px] text-slate-400">나트륨</p>
                  <p className="text-xs font-semibold text-slate-700">
                    {recipe.nutrition.sodium_milligrams}mg
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 거절 사유 */}
        {recipe.rejection_reason && (
          <section className="rounded-lg border border-slate-200 px-3 py-2.5">
            <p className="text-xs whitespace-pre-wrap text-red-600">
              <span className="font-semibold">거절 사유: </span>
              {recipe.rejection_reason}
            </p>
          </section>
        )}

        {/* Import 보완 필요 */}
        {missingLabels.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
            <p className="text-xs font-semibold text-amber-800">
              Import 전 보완 필요:{' '}
              <span className="font-normal">{missingLabels.join(', ')}</span>
            </p>
          </div>
        )}

        {/* Import 완료 정보 */}
        {recipe.imported_recipe_id != null && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
            <p className="text-xs text-emerald-700">
              <span className="font-semibold">Import 완료</span>
              {' · '}Recipe #{recipe.imported_recipe_id}
              {recipe.imported_at && ` · ${formatDate(recipe.imported_at)}`}
            </p>
          </div>
        )}
      </div>

      {/* 상태 변경 영역 */}
      <div className="space-y-2 border-t border-slate-100 px-4 py-3">
        {!recipe.is_active ? (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2.5">
            <p className="text-xs leading-5 text-red-700">
              삭제된 제출건입니다. 사용자가 볼 수 없으며, 필요한 경우 DB에서
              완전히 삭제할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => onHardDelete(recipe.user_recipe_id)}
              disabled={busy}
              className="mt-2 h-9 w-full rounded-lg bg-red-600 px-3 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:bg-red-200"
            >
              DB에서 삭제
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
                상태 변경
                <select
                  value={nextStatus}
                  onChange={event =>
                    setNextStatus(event.target.value as PendingRecipeStatus)
                  }
                  disabled={busy}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-(--color-main-ui)"
                >
                  {STATUS_FILTERS.filter(option => option.value).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  onChangeStatus(
                    recipe.user_recipe_id,
                    nextStatus,
                    reason || undefined,
                  )
                }
                disabled={busy || nextStatus === recipe.status}
                className="mt-5 h-9 rounded-lg bg-(--color-main-ui) px-4 text-sm font-semibold text-white transition-colors hover:bg-(--color-main) disabled:bg-slate-200 disabled:text-slate-400"
              >
                {busy ? '처리 중' : '변경'}
              </button>
            </div>
            <input
              value={reason}
              onChange={event => setReason(event.target.value)}
              placeholder="거절 사유 (REJECTED 선택 시)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none placeholder:text-slate-400 focus:border-(--color-main-ui)"
            />
          </>
        )}
      </div>
    </article>
  );
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<PendingRecipe[]>([]);
  const [statusFilter, setStatusFilter] = useState<PendingRecipeStatus | ''>(
    '',
  );
  const [activeFilter, setActiveFilter] = useState<boolean | ''>(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load(
    nextStatus = statusFilter,
    nextActive = activeFilter,
    q = searchQuery,
  ) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getPendingRecipes(
        nextStatus,
        nextActive,
        q || undefined,
      );
      setRecipes(data);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, '제출 레시피 목록을 불러오지 못했습니다.'),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, activeFilter]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    void load(statusFilter, activeFilter, searchQuery);
  }

  async function runStatusAction(
    id: number,
    nextStatus: PendingRecipeStatus,
    reason?: string,
  ) {
    setBusyId(id);
    setErrorMessage(null);
    try {
      const updated = await changePendingRecipeStatus(id, nextStatus, reason);
      setRecipes(current =>
        current.flatMap(recipe => {
          if (recipe.user_recipe_id !== id) return [recipe];
          if (statusFilter && updated.status !== statusFilter) return [];
          if (activeFilter !== '' && updated.is_active !== activeFilter)
            return [];
          return [updated];
        }),
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '작업을 처리하지 못했습니다.'));
    } finally {
      setBusyId(null);
    }
  }

  async function runHardDelete(id: number) {
    const confirmed = window.confirm(
      '이 제출 레시피를 DB에서 완전히 삭제할까요? 이 작업은 되돌릴 수 없습니다.',
    );
    if (!confirmed) return;

    setBusyId(id);
    setErrorMessage(null);
    try {
      await hardDeletePendingRecipe(id);
      setRecipes(current =>
        current.filter(recipe => recipe.user_recipe_id !== id),
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '삭제를 처리하지 못했습니다.'));
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = recipes.filter(
    r => r.status === 'PENDING' && r.is_active,
  ).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900">
              제출 레시피 검수
              {pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-700">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              원문을 기준으로 노출 가능 여부를 승인하고, Import 준비 상태를
              확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 rounded-lg bg-(--color-main-ui) px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-main)"
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* 검색 */}
          <form onSubmit={handleSearch} className="flex gap-1.5">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="제목 또는 내용 검색"
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-(--color-main-ui)"
            />
            <button
              type="submit"
              className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Search size={14} />
              검색
            </button>
          </form>

          {/* 상태 필터 */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            {STATUS_FILTERS.map(option => (
              <button
                key={option.value || 'ALL'}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  statusFilter === option.value
                    ? 'bg-(--color-main-ui) text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* 활성 필터 */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            {ACTIVE_FILTERS.map(option => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => setActiveFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                  activeFilter === option.value
                    ? 'bg-(--color-main-ui) text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-96 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
              />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
              📋
            </div>
            <p className="text-sm font-semibold text-slate-600">
              조건에 맞는 제출 레시피가 없습니다.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              필터를 변경하거나 새로고침해 보세요.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-xs text-slate-400">총 {recipes.length}건</p>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
              {recipes.map(recipe => (
                <PendingRecipeCard
                  key={recipe.user_recipe_id}
                  recipe={recipe}
                  busy={busyId === recipe.user_recipe_id}
                  onChangeStatus={(id, nextStatus, reason) =>
                    void runStatusAction(id, nextStatus, reason)
                  }
                  onHardDelete={id => void runHardDelete(id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
