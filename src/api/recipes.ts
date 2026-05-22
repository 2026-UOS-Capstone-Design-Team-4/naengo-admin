import {
  PendingRecipe,
  PendingRecipeStatus,
  UserRecipeIngredient,
  UserRecipeNutrition,
  UserRecipeStep,
} from '@/components/RecipeCard';

export interface UserRecipeLabel {
  user_recipe_label_id?: number | null;
  label_type: string;
  label_value: string;
  confidence_score?: number | null;
  source?: string;
  sort_order?: number;
}

import client from './client';

export async function getPendingRecipes(
  status: PendingRecipeStatus | '' = 'PENDING',
  isActive: boolean | '' = true,
  q?: string,
): Promise<PendingRecipe[]> {
  const { data } = await client.get<{ items: PendingRecipe[] }>(
    '/admin/user-recipes',
    {
      params: {
        ...(status ? { status } : {}),
        ...(isActive === '' ? {} : { is_active: isActive }),
        ...(q ? { q } : {}),
        limit: 100,
      },
    },
  );
  return data.items;
}

export interface PendingRecipeUpdatePayload {
  title?: string | null;
  description?: string | null;
  servings?: number | null;
  yield_quantity?: number | null;
  yield_unit?: string | null;
  cooking_time_minutes?: number | null;
  kcal_per_serving?: number | null;
  difficulty?: string | null;
  source_url?: string | null;
  main_image_url?: string | null;
  ingredients?: UserRecipeIngredient[] | null;
  steps?: UserRecipeStep[] | null;
  labels?: UserRecipeLabel[] | null;
  nutrition?: UserRecipeNutrition | null;
  status?: PendingRecipeStatus | null;
  rejection_reason?: string | null;
}

async function patchPendingRecipe(
  id: number,
  payload: PendingRecipeUpdatePayload,
): Promise<PendingRecipe> {
  const { data } = await client.patch<PendingRecipe>(
    `/admin/user-recipes/${id}`,
    payload,
  );
  return data;
}

export async function approvePendingRecipe(id: number): Promise<PendingRecipe> {
  return patchPendingRecipe(id, { status: 'APPROVED' });
}

export async function rejectPendingRecipe(
  id: number,
  reason: string,
): Promise<PendingRecipe> {
  return patchPendingRecipe(id, {
    status: 'REJECTED',
    rejection_reason: reason,
  });
}

export async function changePendingRecipeStatus(
  id: number,
  status: PendingRecipeStatus,
  reason?: string,
): Promise<PendingRecipe> {
  return patchPendingRecipe(id, {
    status,
    rejection_reason: status === 'REJECTED' ? reason || '관리자 거절' : null,
  });
}

export async function hardDeletePendingRecipe(id: number): Promise<void> {
  await client.delete(`/admin/user-recipes/${id}`);
}

export async function updatePendingRecipe(
  id: number,
  payload: PendingRecipeUpdatePayload,
): Promise<PendingRecipe> {
  const safe = { ...payload };
  delete safe.status;
  return patchPendingRecipe(id, safe);
}

const REQUIRED_RECIPE_FIELDS = [
  'description',
  'ingredients',
  'steps',
  'servings',
  'cooking_time_minutes',
  'difficulty',
  'category',
] as const;

type RequiredRecipeField = (typeof REQUIRED_RECIPE_FIELDS)[number];

const RECIPE_FIELD_LABEL: Record<RequiredRecipeField, string> = {
  description: '설명',
  ingredients: '재료',
  steps: '조리 순서',
  servings: '인분',
  cooking_time_minutes: '조리 시간',
  difficulty: '난이도',
  category: '카테고리',
};

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function getMissingFieldLabels(recipe: PendingRecipe): string[] {
  return REQUIRED_RECIPE_FIELDS.filter(field =>
    isEmpty(recipe[field as keyof PendingRecipe]),
  ).map(field => RECIPE_FIELD_LABEL[field]);
}
