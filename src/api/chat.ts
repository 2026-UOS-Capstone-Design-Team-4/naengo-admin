import { Recipe } from '@/components/RecipeCard';

import { apiFetch } from './apiFetch';

const BASE_URL = '/api/v1/chat';
const GUEST_CHAT_URL = '/api/v1/guest/chat';
const ADMIN_BASE_URL = '/api/v1/admin';

export interface ChatRoom {
  room_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  message_id: number;
  role: string;
  content: string;
  recipes: Recipe[] | null;
  created_at: string;
}

export interface GuestHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  image?: string | null;
}

export async function getRooms(): Promise<ChatRoom[]> {
  const response = await apiFetch(`${BASE_URL}/rooms`);
  if (!response.ok) {
    return [];
  }
  return response.json();
}

export async function getRoomMessages(roomId: number): Promise<ChatMessage[]> {
  const response = await apiFetch(`${BASE_URL}/rooms/${roomId}`);
  return response.json();
}

export async function deleteAdminChatRoom(roomId: number): Promise<void> {
  const response = await apiFetch(`${ADMIN_BASE_URL}/chat-rooms/${roomId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('채팅방을 삭제하지 못했습니다.');
  }
}

interface ChatCallbacks {
  onRoom?: (roomId: number) => void;
  onMessage: (chunk: string) => void;
  onRecipes: (recipes: Recipe[]) => void;
  onDone?: (messageId: number | null, recipeIds: number[]) => void;
  onError?: (code: string, message: string) => void;
}

async function parseStream(
  body: ReadableStream<Uint8Array>,
  callbacks: ChatCallbacks,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  let currentEvent = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (currentEvent === 'room') {
          callbacks.onRoom?.(JSON.parse(data).room_id);
        } else if (currentEvent === 'message') {
          callbacks.onMessage(JSON.parse(data).content);
        } else if (currentEvent === 'recipes') {
          callbacks.onRecipes(JSON.parse(data));
        } else if (currentEvent === 'done') {
          const parsed = JSON.parse(data);
          callbacks.onDone?.(parsed.message_id, parsed.recipe_ids ?? []);
        } else if (currentEvent === 'error') {
          const parsed = JSON.parse(data);
          callbacks.onError?.(
            parsed.error?.code ?? parsed.code ?? 'UNKNOWN',
            parsed.error?.message ?? parsed.message ?? '오류가 발생했습니다.',
          );
        }
        currentEvent = '';
      }
    }
  }
}

export async function createRoomAndChat(
  prompt: string,
  callbacks: ChatCallbacks,
  image?: string,
): Promise<void> {
  const response = await apiFetch(`${BASE_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image }),
  });
  if (response.body) await parseStream(response.body, callbacks);
}

export async function guestChat(
  prompt: string,
  callbacks: ChatCallbacks,
  history: GuestHistoryMessage[],
  image?: string,
): Promise<void> {
  const response = await fetch(GUEST_CHAT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image, history }),
  });

  if (!response.ok) {
    throw new Error('게스트 채팅 요청에 실패했습니다.');
  }

  if (response.body) await parseStream(response.body, callbacks);
}

export async function chatInRoom(
  roomId: number,
  prompt: string,
  callbacks: ChatCallbacks,
  image?: string,
): Promise<void> {
  const response = await apiFetch(`${BASE_URL}/rooms/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image }),
  });
  if (response.body) await parseStream(response.body, callbacks);
}
