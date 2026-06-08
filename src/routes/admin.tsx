import { RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  AdminRecipeDetail,
  AdminRecipeFilters,
  AdminRecipeListItem,
  getAdminRecipe,
  getAdminRecipes,
} from '@/api/adminRecipes';
import { getApiErrorMessage } from '@/api/client';

const SORT_OPTIONS = [
  { label: '최신순', value: 'latest' },
  { label: '좋아요순', value: 'likes' },
  { label: '스크랩순', value: 'scraps' },
] as const;

const ACTIVE_OPTIONS = [
  { label: '전체', value: '' },
  { label: '노출', value: 'true' },
  { label: '숨김', value: 'false' },
] as const;

const AUTHOR_OPTIONS = [
  { label: '전체', value: '' },
  { label: '관리자', value: 'ADMIN' },
  { label: '사용자', value: 'USER' },
  { label: '수집 원본', value: 'SOURCE' },
] as const;

const VISIBILITY_OPTIONS = [
  { label: '전체', value: '' },
  { label: '공개', value: 'PUBLIC' },
  { label: '관리자 전용', value: 'ADMIN_ONLY' },
] as const;

const DIFFICULTY_OPTIONS = [
  { label: '전체', value: '' },
  { label: '쉬움', value: 'easy' },
  { label: '보통', value: 'normal' },
  { label: '어려움', value: 'hard' },
] as const;

const SOURCE_OPTIONS = [
  { label: '전체', value: '' },
  { label: '만개의레시피', value: '10000recipe' },
  { label: 'foodsafetykorea', value: 'foodsafetykorea' },
] as const;

function formatDate(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function sourceLabel(value?: string | null) {
  if (value === '10000recipe') return '만개의레시피';
  if (value === 'foodsafetykorea') return 'foodsafetykorea';
  return value || '직접 생성';
}

function difficultyLabel(value?: string | null) {
  if (value === 'easy') return '쉬움';
  if (value === 'normal') return '보통';
  if (value === 'hard') return '어려움';
  return value || '-';
}

function visibilityLabel(value?: string | null) {
  if (value === 'PUBLIC') return '공개';
  if (value === 'ADMIN_ONLY') return '관리자 전용';
  return value || '-';
}

function authorLabel(value?: string | null) {
  if (value === 'ADMIN') return '관리자';
  if (value === 'USER') return '사용자';
  if (value === 'SOURCE') return '수집 원본';
  return value || '-';
}

function formatPercent(value?: number | null) {
  if (value == null) return '-';
  return `${Math.round(value * 100)}%`;
}

function qualityScore(recipe: AdminRecipeListItem) {
  return [
    recipe.has_nutrition,
    recipe.has_classification,
    recipe.has_embedding,
  ].filter(Boolean).length;
}

function SelectFilter({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly { label: string; value: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex min-w-36 flex-col gap-1 text-xs font-semibold text-slate-500">
      {label}
      <select
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-9 rounded border border-slate-200 bg-white px-2 text-sm font-medium text-slate-900 outline-none focus:border-(--color-main-ui)"
      >
        {options.map(option => (
          <option key={option.value || 'all'} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Pill({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'main' | 'neutral' | 'warning';
}) {
  const className =
    tone === 'main'
      ? 'bg-(--color-lighter) text-(--color-main-ui) ring-(--color-light)'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-700 ring-amber-200'
        : 'bg-slate-100 text-slate-600 ring-slate-200';

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${className}`}
    >
      {label}
    </span>
  );
}

function Flag({ active, label }: { active: boolean; label: string }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-xs font-semibold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-400'
      }`}
    >
      {label}
    </span>
  );
}

function QualityFlags({ recipe }: { recipe: AdminRecipeListItem }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Flag active={recipe.has_nutrition} label="영양" />
      <Flag active={recipe.has_classification} label="분류" />
      <Flag active={recipe.has_embedding} label="임베딩" />
    </div>
  );
}

function RecipeRow({
  recipe,
  selected,
  onClick,
}: {
  recipe: AdminRecipeListItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid w-full min-w-[78rem] grid-cols-[5rem_1fr_6rem_6rem_6rem_7rem_8rem_7rem_7rem] items-center gap-3 border-b border-slate-100 px-4 py-3 text-left text-sm transition-colors hover:bg-slate-50 ${
        selected
          ? 'border-l-2 border-l-(--color-main) bg-(--color-lighter)'
          : 'bg-white'
      }`}
    >
      <span className="font-mono text-xs text-slate-500">
        #{recipe.recipe_id}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-slate-950">
          {recipe.title}
        </span>
        <span className="mt-0.5 block truncate text-xs text-slate-500">
          {sourceLabel(recipe.source_site)} ·{' '}
          {visibilityLabel(recipe.visibility)}
        </span>
      </span>
      <span className="text-xs text-slate-600">
        {recipe.cooking_time_minutes}분
      </span>
      <span className="text-xs font-semibold text-slate-600">
        {difficultyLabel(recipe.difficulty)}
      </span>
      <span className="text-xs text-slate-600">
        {recipe.kcal_per_serving ?? '-'} kcal
      </span>
      <Flag
        active={recipe.is_active}
        label={recipe.is_active ? '노출' : '숨김'}
      />
      <QualityFlags recipe={recipe} />
      <span className="text-xs text-slate-600">
        좋아요 {recipe.likes_count} · 스크랩 {recipe.scrap_count}
      </span>
      <span className="text-xs text-slate-500">
        {formatDate(recipe.created_at)}
      </span>
    </button>
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

function TagGroup({
  label,
  values,
  tone = 'neutral',
}: {
  label: string;
  values: string[];
  tone?: 'main' | 'neutral' | 'warning';
}) {
  if (values.length === 0) return null;

  return (
    <div>
      <p className="mb-1 text-xs font-bold text-slate-500">{label}</p>
      <div className="flex flex-wrap gap-1">
        {values.map(value => (
          <Pill key={`${label}-${value}`} label={value} tone={tone} />
        ))}
      </div>
    </div>
  );
}

function DetailPanel({ detail }: { detail: AdminRecipeDetail | null }) {
  const primaryImage = detail?.main_image_url;

  if (!detail) {
    return (
      <aside className="flex h-full items-center justify-center border-l border-slate-200 bg-white text-sm text-slate-500">
        왼쪽 목록에서 레시피를 선택하세요.
      </aside>
    );
  }

  const categories = detail.labels.filter(
    label => label.label_type === 'CATEGORY',
  );
  const labelGroups = Array.from(
    new Set(
      detail.labels
        .map(label => label.label_type)
        .filter(labelType => labelType !== 'CATEGORY'),
    ),
  ).map(labelType => ({
    labelType,
    labels: detail.labels.filter(label => label.label_type === labelType),
  }));
  const classification = detail.classification;

  return (
    <aside className="flex h-full min-h-0 min-w-0 flex-col border-l border-slate-200 bg-white">
      <header className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500">
              #{detail.recipe_id} · {sourceLabel(detail.source_site)}
            </p>
            <h2 className="mt-1 line-clamp-2 text-lg font-bold text-slate-950">
              {detail.title}
            </h2>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <Pill label={visibilityLabel(detail.visibility)} tone="main" />
            <QualityFlags recipe={detail} />
          </div>
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
      </header>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4">
        {primaryImage && (
          <img
            src={primaryImage}
            alt={detail.title}
            className="aspect-video w-full rounded object-cover"
          />
        )}

<section className="grid grid-cols-2 gap-2 xl:grid-cols-3">
          <Metric label="인분" value={detail.servings} />
          <Metric
            label="조리 시간"
            value={`${detail.cooking_time_minutes}분`}
          />
          <Metric label="kcal/인분" value={detail.kcal_per_serving} />
          <Metric label="난이도" value={difficultyLabel(detail.difficulty)} />
          <Metric label="좋아요" value={detail.stats.likes_count} />
          <Metric label="스크랩" value={detail.stats.scrap_count} />
          <Metric label="작성 주체" value={authorLabel(detail.author_type)} />
          <Metric label="품질 점수" value={`${qualityScore(detail)}/3`} />
          <Metric label="수정일" value={formatDate(detail.updated_at)} />
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">본문</h3>
          <p className="text-sm leading-6 whitespace-pre-wrap text-slate-700">
            {detail.description || detail.summary || '-'}
          </p>
        </section>

        {categories.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-slate-950">카테고리</h3>
            <div className="flex flex-wrap gap-1">
              {categories.map(label => (
                <span
                  key={label.label_id}
                  className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700"
                >
                  {label.label_value}
                </span>
              ))}
            </div>
          </section>
        )}

        {labelGroups.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-slate-950">라벨</h3>
            <div className="space-y-3">
              {labelGroups.map(group => (
                <TagGroup
                  key={group.labelType}
                  label={group.labelType}
                  values={group.labels.map(label => label.label_value)}
                  tone={group.labelType === 'CATEGORY' ? 'main' : 'neutral'}
                />
              ))}
            </div>
          </section>
        )}

        {classification && (
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-950">분류 정보</h3>
              <span className="text-xs font-semibold text-slate-500">
                {classification.classification_source} · 신뢰도{' '}
                {formatPercent(classification.confidence_score)}
              </span>
            </div>
            <div className="space-y-3 rounded border border-slate-200 px-3 py-3">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Cuisine" value={classification.cuisine_type} />
                <Metric label="Dish" value={classification.dish_type} />
              </div>
              <TagGroup
                label="조리법"
                values={classification.cooking_methods}
                tone="main"
              />
              <TagGroup label="식사 유형" values={classification.meal_types} />
              <TagGroup label="상황" values={classification.situations} />
              <TagGroup
                label="주재료"
                values={classification.main_ingredients}
              />
              <TagGroup
                label="맛"
                values={classification.taste_keywords}
                tone="warning"
              />
              <TagGroup label="식감" values={classification.texture_keywords} />
              <TagGroup label="식단" values={classification.diet_keywords} />
              <TagGroup
                label="알레르기"
                values={classification.allergen_keywords}
                tone="warning"
              />
              <TagGroup label="도구" values={classification.equipment} />
              <TagGroup label="계절" values={classification.season} />
              <TagGroup
                label="분류 라벨"
                values={classification.category_labels}
                tone="main"
              />
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">원천 정보</h3>
          <div className="grid grid-cols-2 gap-2">
            <Metric label="출처" value={sourceLabel(detail.source_site)} />
            <Metric label="원천 ID" value={detail.source_recipe_id} />
            <Metric label="레코드 ID" value={detail.source_record_id} />
            <Metric label="데이터셋" value={detail.source_dataset_name} />
            <Metric label="작성자" value={detail.source_author_name} />
            <Metric label="기관" value={detail.source_organization} />
            <Metric label="라이선스" value={detail.source_license} />
            <Metric
              label="발행일"
              value={formatDate(detail.source_published_at)}
            />
          </div>
          {detail.source_license_url && (
            <a
              href={detail.source_license_url}
              target="_blank"
              rel="noreferrer"
              className="mt-2 block truncate text-xs font-medium text-(--color-main-ui)"
            >
              {detail.source_license_url}
            </a>
          )}
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">재료</h3>
          <div className="rounded border border-slate-200">
            {detail.ingredients.map(ingredient => (
              <div
                key={ingredient.ingredient_id}
                className="grid grid-cols-[1fr_7rem_5rem] gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-0"
              >
                <span className="font-medium text-slate-900">
                  {ingredient.name}
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
        </section>

        <section>
          <h3 className="mb-2 text-sm font-bold text-slate-950">조리 단계</h3>
          <ol className="space-y-2">
            {detail.steps.map(step => (
              <li
                key={step.step_id}
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
                  <p className="mt-1 text-xs text-slate-500">Tip: {step.tip}</p>
                )}
              </li>
            ))}
          </ol>
        </section>

        {detail.nutrition && (
          <section>
            <h3 className="mb-2 text-sm font-bold text-slate-950">영양 정보</h3>
            <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
              <Metric
                label="탄수화물"
                value={detail.nutrition.carbohydrate_grams}
              />
              <Metric label="단백질" value={detail.nutrition.protein_grams} />
              <Metric label="지방" value={detail.nutrition.fat_grams} />
              <Metric
                label="나트륨"
                value={detail.nutrition.sodium_milligrams}
              />
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}

export default function AdminPage() {
  const [filters, setFilters] = useState<AdminRecipeFilters>({
    sort: 'latest',
    is_active: '',
    source_site: '',
    author_type: '',
    visibility: '',
    difficulty: '',
    q: '',
  });
  const [recipes, setRecipes] = useState<AdminRecipeListItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminRecipeDetail | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);

  const selectedRecipe = useMemo(
    () => recipes.find(recipe => recipe.recipe_id === selectedId) ?? null,
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
        const data = await getAdminRecipes({
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
              currentId && data.items.some(item => item.recipe_id === currentId)
                ? currentId
                : data.items[0].recipe_id,
            );
          }
        }
      } catch (error) {
        if (requestId !== listRequestIdRef.current) return;
        setErrorMessage(
          getApiErrorMessage(error, '운영 레시피 목록을 불러오지 못했습니다.'),
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
      const nextDetail = await getAdminRecipe(recipeId);
      if (requestId !== detailRequestIdRef.current) return;
      setDetail(nextDetail);
    } catch (error) {
      if (requestId !== detailRequestIdRef.current) return;
      setErrorMessage(
        getApiErrorMessage(
          error,
          '운영 레시피 상세 정보를 불러오지 못했습니다.',
        ),
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

  function updateFilter<K extends keyof AdminRecipeFilters>(
    key: K,
    value: AdminRecipeFilters[K],
  ) {
    const next = { ...filters, [key]: value };
    setFilters(next);
  }

  function loadNextPage() {
    if (!nextCursor || loadingMore) return;
    void loadRecipes(filters, { append: true, cursor: nextCursor });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-950">
              운영 레시피 관리
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              정식 등록된 레시피를 조회하고 원본, 영양, 분류 데이터를
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
          <label className="flex min-w-56 flex-col gap-1 text-xs font-semibold text-slate-500">
            검색
            <input
              value={filters.q ?? ''}
              onChange={event => updateFilter('q', event.target.value)}
              placeholder="제목 검색"
              className="h-9 rounded border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 outline-none focus:border-(--color-main-ui)"
            />
          </label>
          <SelectFilter
            label="정렬"
            value={filters.sort ?? 'latest'}
            options={SORT_OPTIONS}
            onChange={value =>
              updateFilter('sort', value as AdminRecipeFilters['sort'])
            }
          />
          <SelectFilter
            label="노출"
            value={String(filters.is_active)}
            options={ACTIVE_OPTIONS}
            onChange={value =>
              updateFilter('is_active', value === '' ? '' : value === 'true')
            }
          />
          <SelectFilter
            label="작성 주체"
            value={filters.author_type ?? ''}
            options={AUTHOR_OPTIONS}
            onChange={value =>
              updateFilter(
                'author_type',
                value as AdminRecipeFilters['author_type'],
              )
            }
          />
          <SelectFilter
            label="공개 범위"
            value={filters.visibility ?? ''}
            options={VISIBILITY_OPTIONS}
            onChange={value =>
              updateFilter(
                'visibility',
                value as AdminRecipeFilters['visibility'],
              )
            }
          />
          <SelectFilter
            label="난이도"
            value={filters.difficulty ?? ''}
            options={DIFFICULTY_OPTIONS}
            onChange={value =>
              updateFilter(
                'difficulty',
                value as AdminRecipeFilters['difficulty'],
              )
            }
          />
          <SelectFilter
            label="출처"
            value={filters.source_site ?? ''}
            options={SOURCE_OPTIONS}
            onChange={value => updateFilter('source_site', value)}
          />
        </div>
      </header>

      {errorMessage && (
        <div className="mx-6 mt-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] overflow-hidden">
        <section className="min-w-0 overflow-hidden bg-white">
          <div className="h-full overflow-auto pb-20">
            <div className="grid min-w-[78rem] grid-cols-[5rem_1fr_6rem_6rem_6rem_7rem_8rem_7rem_7rem] gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold tracking-wide text-slate-500">
              <span>번호</span>
              <span>제목</span>
              <span>시간</span>
              <span>난이도</span>
              <span>칼로리</span>
              <span>상태</span>
              <span>품질</span>
              <span>반응</span>
              <span>생성일</span>
            </div>
            {loading ? (
              <div className="min-w-[78rem]">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[5rem_1fr_6rem_6rem_6rem_7rem_8rem_7rem_7rem] gap-3 border-b border-slate-100 px-4 py-3"
                  >
                    <div className="h-4 w-10 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-48 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-10 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-14 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-10 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                    <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                  </div>
                ))}
              </div>
            ) : recipes.length === 0 ? (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                조건에 맞는 레시피가 없습니다.
              </p>
            ) : (
              <>
                {recipes.map(recipe => (
                  <RecipeRow
                    key={recipe.recipe_id}
                    recipe={recipe}
                    selected={recipe.recipe_id === selectedId}
                    onClick={() => setSelectedId(recipe.recipe_id)}
                  />
                ))}
                {hasNext && (
                  <div className="min-w-[78rem] border-t border-slate-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={loadNextPage}
                      disabled={loadingMore}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:text-slate-400"
                    >
                      {loadingMore ? '불러오는 중...' : `더 보기`}
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
          <DetailPanel detail={detail} />
        )}
      </div>
    </div>
  );
}
