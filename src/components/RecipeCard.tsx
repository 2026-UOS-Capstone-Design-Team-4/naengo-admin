import { useState } from 'react';

export interface IngredientItem {
  name: string;
  amount: string;
  unit: string;
  type: string;
  note?: string;
}

export interface Recipe {
  id: number;
  title: string;
  description: string;
  ingredients: IngredientItem[];
  ingredients_raw: string;
  instructions: string[];
  servings: number;
  cooking_time: number;
  calories?: number | null;
  difficulty: string;
  category: string[];
  tags: string[];
  tips: string[];
  content?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  is_active?: boolean;
  author_type?: string;
  created_at?: string;
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
  const thumbnail = recipe.video_url
    ? getYoutubeThumbnail(recipe.video_url)
    : null;
  const coverImage = thumbnail ?? recipe.image_url ?? null;

  return (
    <div className="mt-2 rounded-2xl border border-(--color-light) bg-(--color-lightest) shadow-sm">
      <button
        onClick={() => setOpen(prev => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-black">{recipe.title}</span>
          <div className="flex gap-2 text-xs text-(--color-muted)">
            {recipe.difficulty && (
              <span>{DIFFICULTY_LABEL[recipe.difficulty] ?? recipe.difficulty}</span>
            )}
            {recipe.cooking_time && <span>{recipe.cooking_time}분</span>}
            {recipe.servings && <span>{recipe.servings}인분</span>}
            {recipe.calories != null && <span>{recipe.calories}kcal</span>}
          </div>
        </div>
        <span className="text-(--color-muted)">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="border-t border-(--color-light) px-4 py-3 text-sm text-black">
          {coverImage && (
            <a
              href={recipe.video_url ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mb-3 block overflow-hidden rounded-xl"
            >
              <img
                src={coverImage}
                alt={recipe.title}
                className="w-full object-cover transition-transform duration-200 group-hover:scale-105"
              />
              {recipe.video_url && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/30">
                  <span className="scale-0 text-5xl text-white drop-shadow-lg transition-transform duration-200 group-hover:scale-100">
                    ▶
                  </span>
                </div>
              )}
            </a>
          )}

          {recipe.description && (
            <p className="mb-3 text-(--color-gray)">{recipe.description}</p>
          )}

          {recipe.category && recipe.category.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1">
              {recipe.category.map((c, i) => (
                <span
                  key={i}
                  className="rounded-full bg-(--color-main) px-2 py-0.5 text-xs text-white"
                >
                  {c}
                </span>
              ))}
            </div>
          )}

          {recipe.tags && recipe.tags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {recipe.tags.map((tag, i) => (
                <span
                  key={i}
                  className="rounded-full border border-(--color-light) px-2 py-0.5 text-xs text-(--color-gray)"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {recipe.ingredients_raw && (
            <div className="mb-2">
              <p className="mb-1 font-semibold text-(--color-main)">재료 (원문)</p>
              <p className="text-(--color-gray)">{recipe.ingredients_raw}</p>
            </div>
          )}

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 font-semibold text-(--color-main)">재료</p>
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-(--color-gray)">
                    <th className="pb-1 pr-3">이름</th>
                    <th className="pb-1 pr-3">양</th>
                    <th className="pb-1 pr-3">단위</th>
                    <th className="pb-1">종류</th>
                  </tr>
                </thead>
                <tbody>
                  {recipe.ingredients.map((ing, i) => (
                    <tr key={i} className="border-t border-(--color-light)">
                      <td className="py-1 pr-3">{ing.name}</td>
                      <td className="py-1 pr-3">{ing.amount}</td>
                      <td className="py-1 pr-3">{ing.unit}</td>
                      <td className="py-1">{ing.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {recipe.instructions && recipe.instructions.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 font-semibold text-(--color-main)">조리 순서</p>
              <ol className="list-decimal pl-4 space-y-1">
                {recipe.instructions.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          {recipe.tips && recipe.tips.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 font-semibold text-(--color-main)">조리 팁</p>
              <ul className="list-disc pl-4 space-y-1 text-(--color-gray)">
                {recipe.tips.map((tip, i) => (
                  <li key={i}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

          {recipe.content && (
            <div className="mb-3">
              <p className="mb-1 font-semibold text-(--color-main)">본문</p>
              <p className="whitespace-pre-wrap text-(--color-gray)">{recipe.content}</p>
            </div>
          )}

          {recipe.video_url && (
            <a
              href={recipe.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-(--color-main-ui) underline"
            >
              영상 보기 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
