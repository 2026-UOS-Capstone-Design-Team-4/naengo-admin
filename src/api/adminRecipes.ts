import client from './client';

export type AdminRecipeSort = 'latest' | 'likes' | 'scraps';
export type AdminRecipeAuthorType = 'ADMIN' | 'USER' | 'SOURCE';
export type AdminRecipeVisibility = 'PUBLIC' | 'ADMIN_ONLY';
export type AdminRecipeDifficulty = 'easy' | 'normal' | 'hard';

export interface AdminRecipeFilters {
  sort?: AdminRecipeSort;
  cursor?: string | null;
  limit?: number;
  is_active?: boolean | '';
  source_site?: string;
  author_type?: AdminRecipeAuthorType | '';
  visibility?: AdminRecipeVisibility | '';
  difficulty?: AdminRecipeDifficulty | '';
  q?: string;
}

export interface AdminRecipeListItem {
  recipe_id: number;
  title: string;
  summary?: string | null;
  servings: number;
  yield_quantity?: number | null;
  yield_unit?: string | null;
  cooking_time_minutes: number;
  kcal_per_serving?: number | null;
  difficulty: string;
  visibility: AdminRecipeVisibility | string;
  author_type: AdminRecipeAuthorType | string;
  source_id?: number | null;
  source_url?: string | null;
  main_image_url?: string | null;
  source_site?: string | null;
  source_recipe_id?: string | null;
  source_record_id?: string | null;
  source_dataset_id?: string | null;
  source_dataset_name?: string | null;
  is_active: boolean;
  created_at?: string | null;
  updated_at?: string | null;
  likes_count: number;
  scrap_count: number;
  has_nutrition: boolean;
  has_classification: boolean;
  has_embedding: boolean;
}

export interface AdminRecipeIngredient {
  ingredient_id: number;
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

export interface AdminRecipeStep {
  step_id: number;
  step_no: number;
  instruction: string;
  image_url?: string | null;
  tip?: string | null;
  sort_order: number;
}

export interface AdminRecipeLabel {
  label_id: number;
  label_type: string;
  label_value: string;
  source: string;
  confidence_score?: number | null;
  sort_order: number;
}

export interface AdminRecipeNutrition {
  serving_weight_grams?: number | null;
  kcal_per_serving?: number | null;
  carbohydrate_grams?: number | null;
  protein_grams?: number | null;
  fat_grams?: number | null;
  sodium_milligrams?: number | null;
  source: string;
  raw_payload: Record<string, unknown>;
  updated_at?: string | null;
}

export interface AdminRecipeClassification {
  cuisine_type?: string | null;
  dish_type?: string | null;
  cooking_methods: string[];
  meal_types: string[];
  occasions: string[];
  situations: string[];
  main_ingredients: string[];
  taste_keywords: string[];
  texture_keywords: string[];
  diet_keywords: string[];
  allergen_keywords: string[];
  equipment: string[];
  season: string[];
  category_labels: string[];
  classification_source: string;
  confidence_score?: number | null;
  updated_at?: string | null;
}

export interface AdminRecipeDetail extends AdminRecipeListItem {
  description: string;
  author_id?: number | null;
  source_author_name?: string | null;
  source_author_url?: string | null;
  source_organization?: string | null;
  source_license?: string | null;
  source_license_url?: string | null;
  source_published_at?: string | null;
  stats: {
    likes_count: number;
    scrap_count: number;
  };
  ingredients: AdminRecipeIngredient[];
  steps: AdminRecipeStep[];
  labels: AdminRecipeLabel[];
  nutrition?: AdminRecipeNutrition | null;
  classification?: AdminRecipeClassification | null;
}

export interface AdminRecipeListResponse {
  items: AdminRecipeListItem[];
  next_cursor: string | null;
  has_next: boolean;
}

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  );
}

export async function getAdminRecipes(
  filters: AdminRecipeFilters = {},
): Promise<AdminRecipeListResponse> {
  const { data } = await client.get<AdminRecipeListResponse>('/admin/recipes', {
    params: cleanParams({ limit: 100, sort: 'latest', ...filters }),
  });
  if (!Array.isArray(data.items)) {
    throw new Error('Invalid admin recipe list response');
  }
  return data;
}

export async function getAdminRecipe(
  recipeId: number,
): Promise<AdminRecipeDetail> {
  const { data } = await client.get<AdminRecipeDetail>(
    `/admin/recipes/${recipeId}`,
  );
  return data;
}
