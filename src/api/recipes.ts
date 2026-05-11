import {
  PendingRecipe,
  PendingRecipeStatus,
  Recipe,
} from '@/components/RecipeCard';

import client from './client';


export async function getRecipeByVideoUrl(videoUrl: string): Promise<Recipe> {
  const { data } = await client.get<Recipe>('/admin/recipes', {
    params: { video_url: videoUrl },
  });
  return data;
}

// ── 제출(pending) 레시피 ───────────────────────────────────────
export async function getPendingRecipes(): Promise<PendingRecipe[]> {
  const { data } = await client.get<PendingRecipe[]>('/pending-recipes');
  return data;
}


export interface PendingRecipeUpdatePayload {
  title?: string | null;
  content?: string | null;
  description?: string | null;
  ingredients?: PendingRecipe['ingredients'];
  ingredients_raw?: string | null;
  instructions?: string[] | null;
  servings?: number | null;
  cooking_time?: number | null;
  calories?: number | null;
  difficulty?: 'easy' | 'normal' | 'hard' | null;
  category?: string[] | null;
  tags?: string[] | null;
  tips?: string[] | null;
  video_url?: string | null;
  image_url?: string | null;
  status?: PendingRecipeStatus | null;
  admin_note?: string | null;
}

async function patchPendingRecipe(
  id: number,
  payload: PendingRecipeUpdatePayload,
): Promise<PendingRecipe> {
  const { data } = await client.patch<PendingRecipe>(
    `/admin/pending-recipes/${id}`,
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
    admin_note: reason,
  });
}

export async function updatePendingRecipe(
  id: number,
  payload: PendingRecipeUpdatePayload,
): Promise<PendingRecipe> {
  
  const { status: _ignored, ...safe } = payload;
  return patchPendingRecipe(id, safe);
}


export const REQUIRED_FIELDS_FOR_APPROVE = [
  'title',
  'description',
  'ingredients',
  'ingredients_raw',
  'instructions',
  'servings',
  'cooking_time',
  'difficulty',
  'category',
] as const;

export type ApproveRequiredField = (typeof REQUIRED_FIELDS_FOR_APPROVE)[number];

const FIELD_LABEL: Record<ApproveRequiredField, string> = {
  title: '제목',
  description: '설명',
  ingredients: '재료 (구조화)',
  ingredients_raw: '재료 원문',
  instructions: '조리 순서',
  servings: '인분',
  cooking_time: '조리시간',
  difficulty: '난이도',
  category: '카테고리',
};

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

export function getMissingFieldsForApprove(
  recipe: Pick<PendingRecipe, ApproveRequiredField>,
): ApproveRequiredField[] {
  return REQUIRED_FIELDS_FOR_APPROVE.filter(field => isEmpty(recipe[field]));
}

export function getMissingFieldLabels(
  recipe: Pick<PendingRecipe, ApproveRequiredField>,
): string[] {
  return getMissingFieldsForApprove(recipe).map(f => FIELD_LABEL[f]);
}
