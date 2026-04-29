import { Recipe } from '@/components/RecipeCard';

const BASE_URL = 'http://localhost:8000/api/v1/chat';

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

export async function getRooms(): Promise<ChatRoom[]> {
  const response = await fetch(`${BASE_URL}/rooms`);
  return response.json();
}

export async function getRoomMessages(roomId: number): Promise<ChatMessage[]> {
  const response = await fetch(`${BASE_URL}/rooms/${roomId}`);
  return response.json();
}


interface ChatCallbacks {
  onRoom?: (roomId: number) => void;
  onMessage: (chunk: string) => void;
  onRecipes: (recipes: Recipe[]) => void;
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
  const response = await fetch(`${BASE_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image }),
  });
  if (response.body) await parseStream(response.body, callbacks);
}

export async function chatInRoom(
  roomId: number,
  prompt: string,
  callbacks: ChatCallbacks,
  image?: string,
): Promise<void> {
  const response = await fetch(`${BASE_URL}/rooms/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, image }),
  });
  if (response.body) await parseStream(response.body, callbacks);
}
