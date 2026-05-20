import {
  PendingRecipe,
  PendingRecipeStatus,
  RecipeDraftPayload,
} from '@/components/RecipeCard';

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
  submission_text?: string | null;
  draft_payload?: RecipeDraftPayload | null;
  ai_suggested_patch?: RecipeDraftPayload | null;
  status?: PendingRecipeStatus | null;
  admin_note?: string | null;
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

const REQUIRED_DRAFT_FIELDS = [
  'description',
  'ingredients',
  'ingredients_raw',
  'instructions',
  'servings',
  'cooking_time_minutes',
  'difficulty',
  'category',
] as const;

type RequiredDraftField = (typeof REQUIRED_DRAFT_FIELDS)[number];

const DRAFT_FIELD_LABEL: Record<RequiredDraftField, string> = {
  description: '설명',
  ingredients: '재료',
  ingredients_raw: '재료 원문',
  instructions: '조리 순서',
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
  const payload = recipe.draft_payload;
  return REQUIRED_DRAFT_FIELDS.filter(field =>
    isEmpty(payload[field as keyof RecipeDraftPayload]),
  ).map(field => DRAFT_FIELD_LABEL[field]);
}
