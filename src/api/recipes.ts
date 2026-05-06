import { Recipe } from '@/components/RecipeCard';

import client from './client';

export async function getRecipeByVideoUrl(videoUrl: string): Promise<Recipe> {
  const { data } = await client.get<Recipe>('/admin/recipes', {
    params: { video_url: videoUrl },
  });
  return data;
}

// ── 스텁 데이터 ────────────────────────────────────────────────
const MOCK_PENDING: Recipe[] = [
  {
    id: 1,
    title: '된장찌개',
    description: '집에서 쉽게 만드는 된장찌개',
    ingredients: [],
    ingredients_raw: '된장 2큰술, 두부 1/2모, 호박 1/4개, 버섯 한줌, 물 500ml',
    instructions: ['냄비에 물을 끓인다', '된장을 풀어준다', '두부와 채소를 넣는다', '10분 끓인다'],
    servings: 2,
    cooking_time: 15,
    calories: 180,
    difficulty: 'easy',
    category: ['한식', '찌개'],
    tags: ['된장', '두부'],
    tips: ['멸치 육수를 쓰면 더 깊은 맛'],
    status: 'pending',
    submitted_by: 'tester1',
    created_at: '2026-05-05T10:00:00Z',
  },
  {
    id: 2,
    title: '계란볶음밥',
    description: '냉장고 재료로 5분만에 완성',
    ingredients: [],
    ingredients_raw: '밥 1공기, 계란 2개, 대파 조금, 간장 1큰술, 참기름',
    instructions: ['팬에 기름을 두른다', '계란을 스크램블한다', '밥을 넣고 볶는다', '간장, 참기름으로 간한다'],
    servings: 1,
    cooking_time: 5,
    calories: 450,
    difficulty: 'easy',
    category: ['한식', '볶음밥'],
    tags: ['계란', '간단'],
    tips: ['찬밥을 쓰면 더 잘 볶인다'],
    status: 'pending',
    submitted_by: 'tester2',
    created_at: '2026-05-05T14:30:00Z',
  },
  {
    id: 3,
    title: '토마토 파스타',
    description: '간단한 마리나라 소스 파스타',
    ingredients: [],
    ingredients_raw: '파스타면 100g, 토마토소스 200ml, 마늘 3쪽, 올리브오일, 소금, 파마산 치즈',
    instructions: ['면을 삶는다', '마늘을 올리브오일에 볶는다', '토마토소스를 붓고 끓인다', '면을 넣고 섞는다'],
    servings: 1,
    cooking_time: 20,
    calories: 520,
    difficulty: 'normal',
    category: ['양식', '파스타'],
    tags: ['토마토', '파스타'],
    tips: ['면수를 조금 넣으면 소스가 잘 붙는다'],
    status: 'pending',
    submitted_by: 'tester3',
    created_at: '2026-05-06T09:00:00Z',
  },
  {
    id: 4,
    title: '닭갈비',
    description: '춘천식 매콤달콤 닭갈비',
    ingredients: [],
    ingredients_raw: '닭다리살 300g, 양배추, 고구마, 떡, 고추장 2큰술, 간장, 설탕, 다진마늘',
    instructions: ['닭을 양념에 30분 재운다', '팬에 기름을 두른다', '닭을 먼저 볶는다', '채소와 떡을 넣고 함께 볶는다'],
    servings: 2,
    cooking_time: 30,
    calories: 620,
    difficulty: 'normal',
    category: ['한식', '볶음'],
    tags: ['닭갈비', '매운'],
    tips: ['치즈를 올리면 더 맛있다'],
    status: 'pending',
    submitted_by: 'tester4',
    created_at: '2026-05-06T11:00:00Z',
  },
  {
    id: 5,
    title: '미역국',
    description: '생일에 꼭 먹는 소고기 미역국',
    ingredients: [],
    ingredients_raw: '미역 30g, 소고기 100g, 참기름, 간장, 다진마늘, 물 1L',
    instructions: ['미역을 불린다', '소고기를 참기름에 볶는다', '물을 붓고 끓인다', '간장으로 간한다'],
    servings: 3,
    cooking_time: 40,
    calories: 150,
    difficulty: 'easy',
    category: ['한식', '국'],
    tags: ['미역', '소고기'],
    tips: ['미역을 충분히 볶아야 비린내가 없다'],
    status: 'pending',
    submitted_by: 'tester5',
    created_at: '2026-05-06T12:30:00Z',
  },
];

// ── 스텁 API ────────────────────────────────────────────────────
export async function getPendingRecipes(): Promise<Recipe[]> {
  // TODO: return (await client.get<Recipe[]>('/admin/recipes/pending')).data;
  return Promise.resolve(MOCK_PENDING);
}

export async function approveRecipe(id: number): Promise<void> {
  // TODO: await client.post(`/admin/recipes/${id}/approve`);
  console.log('[stub] approve recipe', id);
}

export async function rejectRecipe(id: number, reason: string): Promise<void> {
  // TODO: await client.post(`/admin/recipes/${id}/reject`, { reason });
  console.log('[stub] reject recipe', id, reason);
}

export async function updateRecipe(id: number, data: Partial<Recipe>): Promise<Recipe> {
  // TODO: return (await client.patch<Recipe>(`/admin/recipes/${id}`, data)).data;
  console.log('[stub] update recipe', id, data);
  return Promise.resolve({ ...MOCK_PENDING.find(r => r.id === id)!, ...data });
}
