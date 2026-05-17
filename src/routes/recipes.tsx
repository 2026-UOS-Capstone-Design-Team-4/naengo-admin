import { useEffect, useState } from 'react';

import { getApiErrorMessage } from '@/api/client';
import {
  changePendingRecipeStatus,
  getMissingFieldLabels,
  getPendingRecipes,
  hardDeletePendingRecipe,
} from '@/api/recipes';
import { PendingRecipe, PendingRecipeStatus } from '@/components/RecipeCard';

const STATUS_FILTERS: Array<{ label: string; value: PendingRecipeStatus | '' }> = [
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

const STATUS_BADGE_CLASS: Record<PendingRecipeStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700',
  APPROVED: 'bg-emerald-50 text-emerald-700',
  REJECTED: 'bg-red-50 text-red-700',
};

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map(item => {
        if (typeof item === 'string') return item;
        if (item == null) return '';
        return String(item);
      })
      .map(item => item.trim())
      .filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  if (value && typeof value === 'object') {
    return Object.values(value)
      .filter(item => typeof item === 'string' || typeof item === 'number')
      .map(item => String(item).trim())
      .filter(Boolean);
  }

  return [];
}

function toText(value: unknown): string {
  if (Array.isArray(value)) return value.map(toText).filter(Boolean).join(', ');
  if (value == null) return '';
  return String(value);
}

function toInstructionText(item: string | { instruction?: string | null }): string {
  if (typeof item === 'string') return item;
  return item.instruction ?? '';
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

  const draft = recipe.draft_payload;
  const categories = toStringList(draft.category);
  const instructions = draft.instructions ?? [];

  useEffect(() => {
    setNextStatus(recipe.status);
  }, [recipe.status]);

  return (
    <article className="flex h-full min-h-96 flex-col rounded-lg border border-(--color-light) bg-white shadow-sm">
      <div className="border-b border-(--color-light) px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-(--color-muted)">
              #{recipe.pending_recipe_id}
            </p>
            <h2 className="mt-1 line-clamp-2 font-bold text-black">
              {recipe.title}
            </h2>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                STATUS_BADGE_CLASS[recipe.status]
              }`}
            >
              검수 {STATUS_LABEL[recipe.status]}
            </span>
            {!recipe.is_active && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500">
                삭제됨
              </span>
            )}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isImportReady
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-50 text-slate-600'
              }`}
            >
              Import {recipe.import_status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
        <section className="rounded-lg border border-(--color-light) bg-(--color-lightest) px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-black">제출 원문</h3>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-(--color-main)">
              승인 판단 기준
            </span>
          </div>
          <p className="max-h-36 overflow-y-auto whitespace-pre-wrap text-(--color-gray)">
            {recipe.submission_text}
          </p>
        </section>

        <section className="rounded-lg border border-dashed border-(--color-light) px-3 py-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold text-(--color-main)">Import draft</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                isImportReady
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
              }`}
            >
              {isImportReady ? '준비됨' : '보완 필요'}
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {draft.description && (
              <p className="line-clamp-2 text-(--color-gray)">
                {draft.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 text-(--color-muted)">
              {draft.servings != null && <span>{draft.servings}인분</span>}
              {draft.cooking_time_minutes != null && (
                <span>{draft.cooking_time_minutes}분</span>
              )}
              {draft.kcal_per_serving != null && (
                <span>{draft.kcal_per_serving}kcal</span>
              )}
              {draft.difficulty && <span>{draft.difficulty}</span>}
              {recipe.imported_recipe_id != null && (
                <span>Recipe #{recipe.imported_recipe_id}</span>
              )}
              {recipe.imported_at && <span>{recipe.imported_at}</span>}
            </div>

            {draft.ingredients_raw && (
              <p className="line-clamp-2 text-(--color-gray)">
                재료: {toText(draft.ingredients_raw)}
              </p>
            )}
          </div>
        </section>

        {instructions.length > 0 && (
          <section>
            <h3 className="mb-1 font-semibold text-(--color-main)">조리 순서</h3>
            <ol className="list-decimal space-y-1 pl-5 text-(--color-gray)">
              {instructions.map((step, index) => (
                <li key={String(index)}>{toInstructionText(step)}</li>
              ))}
            </ol>
          </section>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {categories.map(category => (
              <span
                key={category}
                className="rounded-full bg-(--color-main) px-2 py-0.5 text-xs text-white"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {recipe.validation_errors.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
            <span className="font-semibold">검증 오류: </span>
            {recipe.validation_errors.map(e => e.message).join(', ')}
          </div>
        )}

        {(recipe.admin_note || recipe.rejection_reason) && (
          <section className="rounded-lg border border-(--color-light) px-3 py-2 text-xs">
            {recipe.admin_note && (
              <p className="whitespace-pre-wrap text-(--color-gray)">
                <span className="font-semibold text-black">관리자 메모: </span>
                {recipe.admin_note}
              </p>
            )}
            {recipe.rejection_reason && (
              <p className="mt-1 whitespace-pre-wrap text-red-600">
                <span className="font-semibold">거절 사유: </span>
                {recipe.rejection_reason}
              </p>
            )}
          </section>
        )}

        {missingLabels.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            <span className="font-semibold">Import 전 보완 필요: </span>
            {missingLabels.join(', ')}
          </div>
        )}
      </div>

      <div className="space-y-2 border-t border-(--color-light) px-4 py-3">
        <div className="rounded-lg border border-(--color-light) bg-(--color-lightest) px-3 py-2">
          <p className="text-xs font-semibold text-(--color-muted)">현재 상태</p>
          <p className="mt-0.5 text-sm font-bold text-black">
            {STATUS_LABEL[recipe.status]}
          </p>
        </div>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="flex flex-col gap-1 text-xs font-semibold text-(--color-muted)">
            변경할 상태
            <select
              value={nextStatus}
              onChange={event =>
                setNextStatus(event.target.value as PendingRecipeStatus)
              }
              disabled={busy || !recipe.is_active}
              className="h-10 rounded-lg border border-(--color-light) bg-white px-3 text-sm font-semibold text-black outline-none focus:border-(--color-main)"
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
                recipe.pending_recipe_id,
                nextStatus,
                reason || undefined,
              )
            }
            disabled={busy || !recipe.is_active || nextStatus === recipe.status}
            className="mt-5 h-10 rounded-lg bg-(--color-main-ui) px-4 text-sm font-semibold text-white disabled:bg-slate-200 disabled:text-slate-500"
          >
            변경
          </button>
        </div>
        <input
          value={reason}
          onChange={event => setReason(event.target.value)}
          placeholder="거절로 변경할 때 사유"
          disabled={!recipe.is_active}
          className="w-full rounded-lg border border-(--color-light) px-3 py-2 text-sm outline-none focus:border-(--color-main)"
        />
        {!recipe.is_active && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-xs leading-5 text-red-700">
              삭제된 제출건입니다. 사용자가 볼 수 없으며, 필요한 경우 DB에서 완전히 삭제할 수 있습니다.
            </p>
            <button
              type="button"
              onClick={() => onHardDelete(recipe.pending_recipe_id)}
              disabled={busy}
              className="mt-2 h-9 w-full rounded-lg bg-red-600 px-3 text-sm font-semibold text-white disabled:bg-red-200"
            >
              DB에서 삭제
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<PendingRecipe[]>([]);
  const [statusFilter, setStatusFilter] = useState<PendingRecipeStatus | ''>('');
  const [activeFilter, setActiveFilter] = useState<boolean | ''>(true);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load(
    nextStatus = statusFilter,
    nextActive = activeFilter,
  ) {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await getPendingRecipes(nextStatus, nextActive);
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
  }, [statusFilter, activeFilter]);

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
          if (recipe.pending_recipe_id !== id) return [recipe];
          if (statusFilter && updated.status !== statusFilter) return [];
          if (activeFilter !== '' && updated.is_active !== activeFilter) return [];
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
        current.filter(recipe => recipe.pending_recipe_id !== id),
      );
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '삭제를 처리하지 못했습니다.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex items-center justify-between border-b border-(--color-light) px-6 py-4">
        <div>
          <h1 className="text-lg font-bold text-black">제출 레시피 검수</h1>
          <p className="mt-1 text-sm text-(--color-gray)">
            원문을 기준으로 노출 가능 여부를 승인하고, 구조화 import 준비 상태는 별도로 확인합니다.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-lg border border-(--color-light) bg-white p-1">
            {STATUS_FILTERS.map(option => (
              <button
                key={option.value || 'ALL'}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  statusFilter === option.value
                    ? 'bg-(--color-main-ui) text-white'
                    : 'text-(--color-gray)'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-(--color-light) bg-white p-1">
            {ACTIVE_FILTERS.map(option => (
              <button
                key={String(option.value)}
                type="button"
                onClick={() => setActiveFilter(option.value)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold ${
                  activeFilter === option.value
                    ? 'bg-(--color-main-ui) text-white'
                    : 'text-(--color-gray)'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-(--color-main-ui) px-4 py-2 text-sm font-semibold text-white"
          >
            새로고침
          </button>
        </div>
      </header>

      {errorMessage && (
        <p className="mx-6 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {errorMessage}
        </p>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading ? (
          <p className="text-sm text-(--color-muted)">불러오는 중...</p>
        ) : recipes.length === 0 ? (
          <p className="text-sm text-(--color-muted)">
            조건에 맞는 제출 레시피가 없습니다.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {recipes.map(recipe => (
              <PendingRecipeCard
                key={recipe.pending_recipe_id}
                recipe={recipe}
                busy={busyId === recipe.pending_recipe_id}
                onChangeStatus={(id, nextStatus, reason) =>
                  void runStatusAction(id, nextStatus, reason)
                }
                onHardDelete={id => void runHardDelete(id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
