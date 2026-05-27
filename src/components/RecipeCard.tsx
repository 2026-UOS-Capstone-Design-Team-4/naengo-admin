import { useState } from 'react';

export interface RecipeStep {
  step_no: number;
  title?: string | null;
  instruction: string;
  tip?: string | null;
}

export interface IngredientItem {
  group_name?: string | null;
  name: string;
  amount?: string | null;
  unit?: string | null;
  type?: string | null;
  note?: string | null;
  raw_text?: string | null;
}

export interface UserRecipeIngredient {
  user_recipe_ingredient_id?: number | null;
  group_name?: string | null;
  name: string;
  normalized_name?: string | null;
  amount_text?: string | null;
  quantity?: number | null;
  unit?: string | null;
  note?: string | null;
  raw_text?: string | null;
  is_optional: boolean;
  sort_order: number;
}

export interface UserRecipeStep {
  user_recipe_step_id?: number | null;
  step_no: number;
  instruction: string;
  image_url?: string | null;
  tip?: string | null;
  sort_order: number;
}

export interface UserRecipeNutrition {
  serving_weight_grams?: number | null;
  carbohydrate_grams?: number | null;
  protein_grams?: number | null;
  fat_grams?: number | null;
  sodium_milligrams?: number | null;
  source: string;
  raw: Record<string, unknown>;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: IngredientItem[];
  steps: RecipeStep[];
  servings: number;
  cooking_time_minutes: number;
  calories?: number | null;
  difficulty: 'easy' | 'normal' | 'hard' | string;
  category: string[];
  tags: string[];
  tips: string[];
  summary?: string | null;
  source_url?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  main_image_url?: string | null;
  is_active?: boolean;
  author_type?: 'ADMIN' | 'USER' | 'SOURCE' | string;
  created_at?: string | null;
  likes_count?: number;
  scrap_count?: number;
  is_liked?: boolean;
  is_scrapped?: boolean;
}

export type PendingRecipeStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PendingRecipeImportStatus = 'NOT_IMPORTED' | 'IMPORTED' | 'FAILED';

export interface PendingRecipe {
  user_recipe_id: number;
  user_id: number;
  title: string;
  description?: string | null;
  servings?: number | null;
  yield_quantity?: number | null;
  yield_unit?: string | null;
  cooking_time_minutes?: number | null;
  kcal_per_serving?: number | null;
  difficulty?: string | null;
  source_url?: string | null;
  main_image_url?: string | null;
  category: string[];
  tags: string[];
  tips: string[];
  warnings: string[];
  ingredients: UserRecipeIngredient[];
  steps: UserRecipeStep[];
  nutrition?: UserRecipeNutrition | null;
  status: PendingRecipeStatus;
  import_status: PendingRecipeImportStatus;
  is_active: boolean;
  rejection_reason?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  imported_recipe_id?: number | null;
  imported_at?: string | null;
  created_at: string;
  updated_at: string;
}

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

function getIngredientText(ingredient: IngredientItem): string {
  if (ingredient.raw_text?.trim()) {
    return ingredient.raw_text.trim();
  }

  return [
    ingredient.name,
    [ingredient.amount, ingredient.unit].filter(Boolean).join(''),
    ingredient.note,
  ]
    .filter(Boolean)
    .join(' ');
}

interface IngredientGroup {
  groupName: string | null;
  ingredients: string[];
}

function getIngredientGroups(ingredients: IngredientItem[]): IngredientGroup[] {
  const groups = new Map<string, IngredientGroup>();

  ingredients.forEach(ingredient => {
    const ingredientText = getIngredientText(ingredient);
    if (!ingredientText) return;

    const groupName = ingredient.group_name?.trim() || null;
    const groupKey = groupName ?? '';
    const group = groups.get(groupKey) ?? { groupName, ingredients: [] };
    group.ingredients.push(ingredientText);
    groups.set(groupKey, group);
  });

  return Array.from(groups.values());
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);
  const coverImage =
    (recipe.video_url ? getYoutubeThumbnail(recipe.video_url) : null) ??
    recipe.main_image_url ??
    recipe.image_url;
  const ingredientGroups = getIngredientGroups(recipe.ingredients);

  return (
    <article className="rounded-lg border border-(--color-light) bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-black">{recipe.title}</h3>
          <div className="mt-1 flex flex-wrap gap-2 text-xs text-(--color-gray)">
            <span>
              {DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}
            </span>
            <span>{recipe.cooking_time_minutes}분</span>
            <span>{recipe.servings}인분</span>
            {recipe.calories != null && <span>{recipe.calories}kcal</span>}
          </div>
        </div>
        <span className="text-sm text-(--color-muted)">
          {open ? '접기' : '보기'}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-(--color-light) px-4 py-4 text-sm">
          {coverImage && (
            <img
              src={coverImage}
              alt={recipe.title}
              className="aspect-video w-full rounded-lg object-cover"
            />
          )}

          <p className="text-(--color-gray)">{recipe.description}</p>

          {(recipe.category.length > 0 || recipe.tags.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {recipe.category.map(item => (
                <span
                  key={`category-${item}`}
                  className="rounded-full bg-(--color-main) px-2 py-0.5 text-xs text-white"
                >
                  {item}
                </span>
              ))}
              {recipe.tags.map(item => (
                <span
                  key={`tag-${item}`}
                  className="rounded-full border border-(--color-light) px-2 py-0.5 text-xs text-(--color-gray)"
                >
                  #{item}
                </span>
              ))}
            </div>
          )}

          <section>
            <h4 className="mb-1 font-semibold text-(--color-main)">재료</h4>
            {ingredientGroups.length > 0 ? (
              <div className="space-y-3">
                {ingredientGroups.map(group => (
                  <div key={group.groupName ?? 'default'}>
                    {group.groupName && (
                      <p className="mb-1 text-xs font-semibold text-(--color-gray)">
                        {group.groupName}
                      </p>
                    )}
                    <ul className="grid gap-1 text-(--color-gray) sm:grid-cols-2">
                      {group.ingredients.map((ingredient, index) => (
                        <li
                          key={`${ingredient}-${index}`}
                          className="rounded-md bg-(--color-lightest) px-2 py-1"
                        >
                          {ingredient}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-(--color-gray)">재료 정보가 없습니다.</p>
            )}
          </section>

          {recipe.steps.length > 0 && (
            <section>
              <h4 className="mb-1 font-semibold text-(--color-main)">
                조리 순서
              </h4>
              <ol className="list-decimal space-y-2 pl-5 text-(--color-gray)">
                {recipe.steps.map(step => (
                  <li key={step.step_no}>
                    {step.title && (
                      <span className="font-medium">{step.title} — </span>
                    )}
                    {step.instruction}
                    {step.tip && (
                      <p className="mt-0.5 text-xs text-(--color-muted) italic">
                        Tip: {step.tip}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          {recipe.video_url && (
            <a
              href={recipe.video_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex text-(--color-main-ui) underline"
            >
              원본 영상 보기
            </a>
          )}

          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex max-w-full break-all text-(--color-main-ui) underline"
            >
              {recipe.source_url}
            </a>
          )}
        </div>
      )}
    </article>
  );
}
