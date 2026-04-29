import { Recipe } from '@/components/RecipeCard';

import client from './client';

export async function getRecipeByVideoUrl(videoUrl: string): Promise<Recipe> {
  const { data } = await client.get<Recipe>('/admin/recipes', {
    params: { video_url: videoUrl },
  });
  return data;
}
