import { useState } from 'react';

export interface RecipeStep {
  step_no: number;
  title?: string | null;
  instruction: string;
  tip?: string | null;
}

export interface IngredientItem {
  name: string;
  amount: string;
  unit: string;
  type: string;
  note?: string | null;
}

export interface RecipeDraftPayload {
  title?: string | null;
  description?: string | null;
  ingredients?: IngredientItem[] | null;
  ingredients_raw?: string | string[] | null;
  instructions?: Array<string | RecipeStep> | null;
  servings?: number | null;
  cooking_time_minutes?: number | null;
  kcal_per_serving?: number | null;
  difficulty?: 'easy' | 'normal' | 'hard' | null;
  category?: string | string[] | Record<string, unknown> | null;
  tags?: string | string[] | null;
  tips?: string | string[] | null;
  video_url?: string | null;
  image_url?: string | null;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: IngredientItem[];
  ingredients_raw: string;
  steps: RecipeStep[];
  servings: number;
  cooking_time_minutes: number;
  calories?: number | null;
  difficulty: 'easy' | 'normal' | 'hard' | string;
  category: string[];
  tags: string[];
  tips: string[];
  summary?: string | null;
  video_url?: string | null;
  image_url?: string | null;
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
  submission_text: string;
  draft_payload: RecipeDraftPayload;
  ai_suggested_patch: Partial<RecipeDraftPayload>;
  validation_errors: Array<{ field: string; message: string }>;
  status: PendingRecipeStatus;
  import_status: PendingRecipeImportStatus;
  is_active: boolean;
  admin_note?: string | null;
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

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);
  const coverImage = recipe.video_url
    ? getYoutubeThumbnail(recipe.video_url)
    : recipe.image_url;

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
            <p className="text-(--color-gray)">{recipe.ingredients_raw}</p>
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
        </div>
      )}
    </article>
  );
}
