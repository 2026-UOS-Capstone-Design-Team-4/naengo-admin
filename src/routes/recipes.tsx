import {
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getApiErrorMessage } from '@/api/client';
import {
  changePendingRecipeStatus,
  getMissingFieldLabels,
  getPendingRecipe,
  getPendingRecipes,
  hardDeletePendingRecipe,
  type PendingRecipeFilters,
} from '@/api/recipes';
import {
  type PendingRecipe,
  type PendingRecipeImportStatus,
  type PendingRecipeStatus,
  type UserRecipeIngredient,
} from '@/components/RecipeCard';

const STATUS_OPTIONS: Array<{
  label: string;
  value: PendingRecipeStatus | '';
}> = [
  { label: '전체', value: '' },
  { label: '대기', value: 'PENDING' },
  { label: '승인', value: 'APPROVED' },
  { label: '거절', value: 'REJECTED' },
];

const ACTIVE_OPTIONS: Array<{ label: string; value: boolean | '' }> = [
  { label: '활성', value: true },
  { label: '삭제됨', value: false },
  { label: '전체', value: '' },
];

const STATUS_LABEL: Record<PendingRecipeStatus, string> = {
  PENDING: '대기',
  APPROVED: '승인',
  REJECTED: '거절',
};

const IMPORT_STATUS_LABEL: Record<PendingRecipeImportStatus, string> = {
  NOT_IMPORTED: '미임포트',
  IMPORTED: '임포트 완료',
  FAILED: '임포트 실패',
};

const STATUS_BADGE_CLASS: Record<PendingRecipeStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const IMPORT_BADGE_CLASS: Record<PendingRecipeImportStatus, string> = {
  NOT_IMPORTED: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
  IMPORTED: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  FAILED: 'bg-red-50 text-red-700 ring-1 ring-red-200',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '쉬움',
  normal: '보통',
  hard: '어려움',
};

const READINESS_FIELDS = [
  { label: '제목', isReady: (recipe: PendingRecipe) => !!recipe.title.trim() },
  {
    label: '설명',
    isReady: (recipe: PendingRecipe) => !!recipe.description?.trim(),
  },
  {
    label: '재료',
    isReady: (recipe: PendingRecipe) => recipe.ingredients.length > 0,
  },
  {
    label: '조리 순서',
    isReady: (recipe: PendingRecipe) => recipe.steps.length > 0,
  },
  {
    label: '인분',
    isReady: (recipe: PendingRecipe) => recipe.servings != null,
  },
  {
    label: '조리 시간',
    isReady: (recipe: PendingRecipe) => recipe.cooking_time_minutes != null,
  },
  {
    label: '난이도',
    isReady: (recipe: PendingRecipe) => !!recipe.difficulty,
  },
  {
    label: '라벨',
    isReady: (recipe: PendingRecipe) => recipe.category.length > 0,
  },
] as const;

interface IngredientGroup {
  groupName: string | null;
  ingredients: UserRecipeIngredient[];
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDifficulty(value?: string | null) {
  if (!value) return '-';
  return DIFFICULTY_LABEL[value] ?? value;
}

function groupIngredients(
  ingredients: UserRecipeIngredient[],
): IngredientGroup[] {
  const groups = new Map<string, IngredientGroup>();

  ingredients.forEach(ingredient => {
    const groupName = ingredient.group_name?.trim() || null;
    const key = groupName ?? '';
    const group = groups.get(key) ?? { groupName, ingredients: [] };
    group.ingredients.push(ingredient);
    groups.set(key, group);
  });

  return Array.from(groups.values());
}

function SelectFilter<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | '';
  options: readonly { label: string; value: T | '' }[];
  onChange: (value: T | '') => void;
}) {
  return (
    <label className="flex min-w-32 flex-col gap-1 text-xs font-semibold text-slate-500">
      {label}
      <select
        value={String(value)}
        onChange={event => {
          const option = options.find(
            item => String(item.value) === event.target.value,
          );
          onChange(option?.value ?? '');
        }}
        className="h-9 rounded border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 outline-none focus:border-(--color-main-ui)"
      >
        {options.map(option => (
          <option
            key={String(option.value) || 'all'}
            value={String(option.value)}
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberFilter({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | '';
  onChange: (value: number | '') => void;
}) {
  return (
    <label className="flex min-w-36 flex-col gap-1 text-xs font-semibold text-slate-500">
      {label}
      <input
        value={value}
        inputMode="numeric"
        onChange={event => {
          const next = event.target.value.trim();
          if (!next) {
            onChange('');
            return;
          }
          const parsed = Number(next);
          if (Number.isInteger(parsed) && parsed > 0) {
            onChange(parsed);
          }
        }}
        className="h-9 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-(--color-main-ui)"
      />
    </label>
  );
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      {label}
    </span>
  );
}

function ReadinessBadge({ recipe }: { recipe: PendingRecipe }) {
  const missingLabels = getMissingFieldLabels(recipe);
  const ready = missingLabels.length === 0;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        ready
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200'
      }`}
      title={ready ? '승인 필수 필드 충족' : missingLabels.join(', ')}
    >
      {ready ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
      {ready ? '승인 가능' : `${missingLabels.length}개 보완`}
    </span>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">
        {value ?? '-'}
      </p>
    </div>
  );
}

function PillList({
  title,
  values,
  tone = 'neutral',
}: {
  title: string;
  values: string[];
  tone?: 'main' | 'neutral' | 'warning';
}) {
  if (values.length === 0) return null;

  const className =
    tone === 'main'
      ? 'bg-(--color-lighter) text-(--color-main-ui) ring-(--color-light)'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-slate-950">{title}</h3>
      <div className="flex flex-wrap gap-1">
        {values.map(value => (
          <span
            key={value}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}
          >
            {value}
          </span>
        ))}
      </div>
    </section>
  );
}

function RecipeRow({
  recipe,
  selected,
  onClick,
}: {
  recipe: PendingRecipe;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid w-full min-w-[68rem] grid-cols-[5rem_6rem_1fr_7rem_8rem_8rem_7rem] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
        selected
          ? 'border-l-2 border-l-(--color-main) bg-(--color-lighter)'
          : 'bg-white'
      }`}
    >
      <span className="font-mono text-xs text-slate-500">
        #{recipe.user_recipe_id}
      </span>
      <span className="font-mono text-xs text-slate-600">
        user #{recipe.user_id}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-950">
          {recipe.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {recipe.description || '설명 없음'}
        </span>
      </span>
      <Badge
        label={STATUS_LABEL[recipe.status]}
        className={STATUS_BADGE_CLASS[recipe.status]}
      />
      <Badge
        label={IMPORT_STATUS_LABEL[recipe.import_status]}
        className={IMPORT_BADGE_CLASS[recipe.import_status]}
      />
      <ReadinessBadge recipe={recipe} />
      <span className="text-xs text-slate-500">
        {formatDate(recipe.created_at)}
      </span>
    </button>
  );
}

function ReadinessChecklist({ recipe }: { recipe: PendingRecipe }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-950">승인 필수 항목</h3>
        <ReadinessBadge recipe={recipe} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {READINESS_FIELDS.map(field => {
          const ready = field.isReady(recipe);
          return (
            <div
              key={field.label}
              className={`flex items-center gap-2 rounded border px-3 py-2 text-sm ${
                ready
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                  : 'border-amber-100 bg-amber-50 text-amber-700'
              }`}
            >
              {ready ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span className="font-semibold">{field.label}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RecipeReviewForm({
  detail,
  busy,
  onChangeStatus,
  onHardDelete,
}: {
  detail: PendingRecipe;
  busy: boolean;
  onChangeStatus: (
    id: number,
    status: PendingRecipeStatus,
    reason?: string,
  ) => void;
  onHardDelete: (id: number) => void;
}) {
  const [nextStatus, setNextStatus] = useState<PendingRecipeStatus>(
    detail.status,
  );
  const [reason, setReason] = useState(detail.rejection_reason ?? '');
  const missingLabels = getMissingFieldLabels(detail);
  const approvalBlocked = nextStatus === 'APPROVED' && missingLabels.length > 0;
  const rejectionBlocked = nextStatus === 'REJECTED' && !reason.trim();
  const unchanged =
    nextStatus === detail.status && reason === (detail.rejection_reason ?? '');

  if (!detail.is_active) {
    return (
      <section className="space-y-3 border-t border-slate-100 pt-4">
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 text-red-700">
          비활성 제출건입니다. 사용자 화면에는 노출되지 않으며, OpenAPI 정책상
          비활성 건만 물리 삭제할 수 있습니다.
        </div>
        <button
          type="button"
          onClick={() => onHardDelete(detail.user_recipe_id)}
          disabled={busy}
          className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:bg-red-200"
        >
          <Trash2 size={14} />
          DB에서 삭제
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-3 border-t border-slate-100 pt-4">
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        검수 상태
        <select
          value={nextStatus}
          onChange={event =>
            setNextStatus(event.target.value as PendingRecipeStatus)
          }
          disabled={busy}
          className="h-9 rounded border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900 outline-none focus:border-(--color-main-ui)"
        >
          {STATUS_OPTIONS.filter(option => option.value).map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
        거절 사유
        <textarea
          value={reason}
          onChange={event => setReason(event.target.value)}
          disabled={busy}
          rows={4}
          placeholder="REJECTED 선택 시 사용자와 운영자가 이해할 수 있는 사유를 남깁니다."
          className="resize-none rounded border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-(--color-main-ui)"
        />
      </label>
      {approvalBlocked && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-700">
          승인 전 보완 필요: {missingLabels.join(', ')}
        </p>
      )}
      {rejectionBlocked && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
          거절 처리 시 사유를 입력해 주세요.
        </p>
      )}
      <button
        type="button"
        onClick={() =>
          onChangeStatus(
            detail.user_recipe_id,
            nextStatus,
            reason.trim() || undefined,
          )
        }
        disabled={busy || unchanged || approvalBlocked || rejectionBlocked}
        className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-(--color-main-ui) px-4 text-sm font-bold text-white transition-colors hover:bg-(--color-main) disabled:bg-slate-200 disabled:text-slate-400"
      >
        <CheckCircle2 size={14} />
        {busy ? '처리 중' : '검수 결과 저장'}
      </button>
    </section>
  );
}

function DetailPanel({
  detail,
  busy,
  onChangeStatus,
  onHardDelete,
}: {
  detail: PendingRecipe | null;
  busy: boolean;
  onChangeStatus: (
    id: number,
    status: PendingRecipeStatus,
    reason?: string,
  ) => void;
  onHardDelete: (id: number) => void;
}) {
  const ingredientGroups = useMemo(
    () => groupIngredients(detail?.ingredients ?? []),
    [detail],
  );

  if (!detail) {
    return (
      <aside className="flex h-full items-center justify-center border-l border-slate-200 bg-white text-sm text-slate-500">
        왼쪽 목록에서 제출 레시피를 선택하세요.
      </aside>
    );
  }

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">
              제출 #{detail.user_recipe_id} · user #{detail.user_id}
            </p>
            <h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-950">
              {detail.title}
            </h2>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Badge
              label={STATUS_LABEL[detail.status]}
              className={STATUS_BADGE_CLASS[detail.status]}
            />
            <Badge
              label={IMPORT_STATUS_LABEL[detail.import_status]}
              className={IMPORT_BADGE_CLASS[detail.import_status]}
            />
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {detail.main_image_url && (
          <img
            src={detail.main_image_url}
            alt={detail.title}
            className="aspect-video w-full rounded object-cover"
          />
        )}

        <section className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          <Metric label="인분" value={detail.servings} />
          <Metric
            label="조리 시간"
            value={
              detail.cooking_time_minutes == null
                ? null
                : `${detail.cooking_time_minutes}분`
            }
          />
          <Metric label="kcal/인분" value={detail.kcal_per_serving} />
          <Metric label="난이도" value={formatDifficulty(detail.difficulty)} />
        </section>

        <ReadinessChecklist recipe={detail} />

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">본문</h3>
          <p className="rounded border border-slate-200 bg-white px-3 py-2 text-sm leading-6 whitespace-pre-wrap text-slate-700">
            {detail.description || '설명이 없습니다.'}
          </p>
        </section>

        <PillList title="카테고리" values={detail.category} tone="main" />
        <PillList title="태그" values={detail.tags} />
        <PillList title="팁" values={detail.tips} />
        <PillList title="주의사항" values={detail.warnings} tone="warning" />

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">재료</h3>
          {ingredientGroups.length > 0 ? (
            <div className="space-y-2">
              {ingredientGroups.map(group => (
                <div
                  key={group.groupName ?? 'default'}
                  className="rounded border border-slate-200"
                >
                  {group.groupName && (
                    <p className="border-b border-slate-100 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">
                      {group.groupName}
                    </p>
                  )}
                  {group.ingredients.map(ingredient => (
                    <div
                      key={
                        ingredient.user_recipe_ingredient_id ??
                        `${ingredient.name}-${ingredient.sort_order}`
                      }
                      className="grid grid-cols-[1fr_7rem_4rem] gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-0"
                    >
                      <span className="font-medium text-slate-900">
                        {ingredient.name}
                        {ingredient.normalized_name && (
                          <span className="ml-1 text-xs font-normal text-slate-400">
                            ({ingredient.normalized_name})
                          </span>
                        )}
                      </span>
                      <span className="text-slate-600">
                        {ingredient.amount_text || '-'}
                      </span>
                      <span className="text-slate-500">
                        {ingredient.is_optional ? '선택' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              재료가 없습니다.
            </p>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">조리 단계</h3>
          {detail.steps.length > 0 ? (
            <ol className="space-y-2">
              {detail.steps.map(step => (
                <li
                  key={step.user_recipe_step_id ?? step.step_no}
                  className="rounded border border-slate-200 px-3 py-2 text-sm"
                >
                  <p className="font-semibold text-slate-500">
                    Step {step.step_no}
                  </p>
                  <p className="mt-1 leading-6 text-slate-800">
                    {step.instruction}
                  </p>
                  {step.image_url && (
                    <img
                      src={step.image_url}
                      alt={`Step ${step.step_no}`}
                      className="mt-2 rounded"
                    />
                  )}
                  {step.tip && (
                    <p className="mt-1 text-xs text-slate-500">
                      Tip: {step.tip}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          ) : (
            <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
              조리 단계가 없습니다.
            </p>
          )}
        </section>

        {detail.nutrition && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-slate-950">영양 정보</h3>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              <Metric
                label="탄수화물"
                value={
                  detail.nutrition.carbohydrate_grams == null
                    ? null
                    : `${detail.nutrition.carbohydrate_grams}g`
                }
              />
              <Metric
                label="단백질"
                value={
                  detail.nutrition.protein_grams == null
                    ? null
                    : `${detail.nutrition.protein_grams}g`
                }
              />
              <Metric
                label="지방"
                value={
                  detail.nutrition.fat_grams == null
                    ? null
                    : `${detail.nutrition.fat_grams}g`
                }
              />
              <Metric
                label="나트륨"
                value={
                  detail.nutrition.sodium_milligrams == null
                    ? null
                    : `${detail.nutrition.sodium_milligrams}mg`
                }
              />
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">운영 이력</h3>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="제출일" value={formatDate(detail.created_at)} />
            <Metric label="수정일" value={formatDate(detail.updated_at)} />
            <Metric
              label="검토"
              value={
                detail.reviewed_by
                  ? `#${detail.reviewed_by} · ${formatDate(detail.reviewed_at)}`
                  : '-'
              }
            />
            <Metric
              label="임포트"
              value={
                detail.imported_recipe_id
                  ? `recipe #${detail.imported_recipe_id}`
                  : IMPORT_STATUS_LABEL[detail.import_status]
              }
            />
          </div>
          {detail.source_url && (
            <a
              href={detail.source_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block truncate text-xs font-medium text-(--color-main-ui)"
            >
              {detail.source_url}
            </a>
          )}
          {detail.rejection_reason && (
            <p className="mt-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm leading-6 whitespace-pre-wrap text-red-700">
              {detail.rejection_reason}
            </p>
          )}
        </section>

        <RecipeReviewForm
          key={detail.user_recipe_id}
          detail={detail}
          busy={busy}
          onChangeStatus={onChangeStatus}
          onHardDelete={onHardDelete}
        />
      </div>
    </aside>
  );
}

export default function RecipesPage() {
  const [filters, setFilters] = useState<PendingRecipeFilters>({
    status: 'PENDING',
    is_active: true,
    user_id: '',
    q: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState<PendingRecipe[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<PendingRecipe | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const selectedRecipe = useMemo(
    () => recipes.find(recipe => recipe.user_recipe_id === selectedId) ?? null,
    [recipes, selectedId],
  );

  const loadRecipes = useCallback(
    async (
      nextFilters = filters,
      options: { append?: boolean; cursor?: string | null } = {},
    ) => {
      const append = options.append === true;
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      const requestId = ++listRequestIdRef.current;
      setErrorMessage(null);
      try {
        const data = await getPendingRecipes({
          ...nextFilters,
          cursor: options.cursor,
        });
        if (requestId !== listRequestIdRef.current) return;
        setNextCursor(data.next_cursor);
        setHasNext(data.has_next);
        if (append) {
          setRecipes(currentRecipes => [...currentRecipes, ...data.items]);
        } else {
          setRecipes(data.items);
          if (data.items.length === 0) {
            setSelectedId(null);
            setDetail(null);
          } else {
            setSelectedId(currentId =>
              currentId &&
              data.items.some(item => item.user_recipe_id === currentId)
                ? currentId
                : data.items[0].user_recipe_id,
            );
          }
        }
      } catch (error) {
        if (requestId !== listRequestIdRef.current) return;
        setErrorMessage(
          getApiErrorMessage(error, '제출 레시피 목록을 불러오지 못했습니다.'),
        );
      } finally {
        if (requestId === listRequestIdRef.current) {
          if (append) {
            setLoadingMore(false);
          } else {
            setLoading(false);
          }
        }
      }
    },
    [filters],
  );

  const loadDetail = useCallback(async (recipeId: number) => {
    setDetailLoading(true);
    const requestId = ++detailRequestIdRef.current;
    setErrorMessage(null);
    try {
      const nextDetail = await getPendingRecipe(recipeId);
      if (requestId !== detailRequestIdRef.current) return;
      setDetail(nextDetail);
    } catch (error) {
      if (requestId !== detailRequestIdRef.current) return;
      setErrorMessage(
        getApiErrorMessage(error, '제출 레시피 상세를 불러오지 못했습니다.'),
      );
    } finally {
      if (requestId === detailRequestIdRef.current) {
        setDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRecipes();
  }, [loadRecipes]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selectedId) void loadDetail(selectedId);
  }, [loadDetail, selectedId]);

  function updateFilter<K extends keyof PendingRecipeFilters>(
    key: K,
    value: PendingRecipeFilters[K],
  ) {
    setFilters(current => ({ ...current, [key]: value, cursor: null }));
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(current => ({
      ...current,
      q: searchQuery.trim(),
      cursor: null,
    }));
  }

  function loadNextPage() {
    if (!nextCursor || loadingMore) return;
    void loadRecipes(filters, { append: true, cursor: nextCursor });
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
      const stillVisible =
        (!filters.status || updated.status === filters.status) &&
        (filters.is_active === '' || updated.is_active === filters.is_active) &&
        (!filters.user_id || updated.user_id === filters.user_id);

      setRecipes(currentRecipes =>
        currentRecipes.flatMap(recipe => {
          if (recipe.user_recipe_id !== id) return [recipe];
          return stillVisible ? [updated] : [];
        }),
      );

      if (stillVisible) {
        setDetail(updated);
      } else {
        setSelectedId(null);
        setDetail(null);
      }
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
      setRecipes(currentRecipes =>
        currentRecipes.filter(recipe => recipe.user_recipe_id !== id),
      );
      setSelectedId(null);
      setDetail(null);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, '삭제를 처리하지 못했습니다.'));
    } finally {
      setBusyId(null);
    }
  }

  const pendingCount = recipes.filter(
    recipe => recipe.status === 'PENDING' && recipe.is_active,
  ).length;
  const readyCount = recipes.filter(
    recipe => getMissingFieldLabels(recipe).length === 0,
  ).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950">
              제출 레시피 검수
              {pendingCount > 0 && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-sm font-semibold text-amber-700">
                  {pendingCount}
                </span>
              )}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              최신 제출순 큐에서 필수 필드, 상태, Import 준비 상태를 한 번에
              확인합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadRecipes()}
            className="flex h-9 items-center gap-1.5 rounded-lg bg-(--color-main-ui) px-4 text-sm font-bold text-white transition-colors hover:bg-(--color-main)"
          >
            <RefreshCw size={14} />
            새로고침
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <form onSubmit={handleSearch} className="flex min-w-72 gap-1.5">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-slate-500">
              검색
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="제목 검색"
                className="h-9 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-(--color-main-ui)"
              />
            </label>
            <button
              type="submit"
              className="mt-5 flex h-9 items-center gap-1 rounded border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              <Search size={14} />
              검색
            </button>
          </form>
          <SelectFilter
            label="검수 상태"
            value={filters.status ?? ''}
            options={STATUS_OPTIONS}
            onChange={value =>
              updateFilter('status', value as PendingRecipeFilters['status'])
            }
          />
          <SelectFilter
            label="활성 상태"
            value={filters.is_active ?? ''}
            options={ACTIVE_OPTIONS}
            onChange={value =>
              updateFilter(
                'is_active',
                value as PendingRecipeFilters['is_active'],
              )
            }
          />
          <NumberFilter
            label="사용자 ID"
            value={filters.user_id ?? ''}
            onChange={value => updateFilter('user_id', value)}
          />
          <div className="grid grid-cols-2 gap-2">
            <Metric label="현재 목록" value={`${recipes.length}건`} />
            <Metric label="승인 가능" value={`${readyCount}건`} />
          </div>
        </div>
      </header>

      {errorMessage && (
        <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(22rem,31rem)] overflow-hidden">
        <section className="min-w-0 overflow-hidden bg-white">
          <div className="h-full overflow-auto pb-20">
            <div className="grid min-w-[68rem] grid-cols-[5rem_6rem_1fr_7rem_8rem_8rem_7rem] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold tracking-wide text-slate-500">
              <span>번호</span>
              <span>사용자</span>
              <span>제목</span>
              <span>검수</span>
              <span>Import</span>
              <span>필수 항목</span>
              <span>제출일</span>
            </div>
            {loading ? (
              <div className="min-w-[68rem]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[5rem_6rem_1fr_7rem_8rem_8rem_7rem] gap-3 border-b border-slate-100 px-4 py-3"
                  >
                    {Array.from({ length: 7 }).map((__, j) => (
                      <div
                        key={j}
                        className="h-4 animate-pulse rounded bg-slate-200"
                      />
                    ))}
                  </div>
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ClipboardList className="mb-3 text-slate-300" size={40} />
                <p className="text-sm font-semibold text-slate-600">
                  조건에 맞는 제출 레시피가 없습니다.
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  필터를 변경하거나 새로고침해 보세요.
                </p>
              </div>
            ) : (
              <>
                {recipes.map(recipe => (
                  <RecipeRow
                    key={recipe.user_recipe_id}
                    recipe={recipe}
                    selected={recipe.user_recipe_id === selectedId}
                    onClick={() => setSelectedId(recipe.user_recipe_id)}
                  />
                ))}
                {hasNext && (
                  <div className="min-w-[68rem] border-t border-slate-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={loadNextPage}
                      disabled={loadingMore}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:text-slate-400"
                    >
                      {loadingMore ? '불러오는 중...' : '더 보기'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {detailLoading && selectedRecipe ? (
          <aside className="flex h-full items-center justify-center border-l border-slate-200 bg-white text-sm text-slate-500">
            상세 정보를 불러오는 중...
          </aside>
        ) : (
          <DetailPanel
            detail={detail}
            busy={busyId === detail?.user_recipe_id}
            onChangeStatus={(id, nextStatus, reason) =>
              void runStatusAction(id, nextStatus, reason)
            }
            onHardDelete={id => void runHardDelete(id)}
          />
        )}
      </div>
    </div>
  );
}
