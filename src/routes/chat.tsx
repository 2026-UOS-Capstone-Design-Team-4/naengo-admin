import { Image, Plus, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import {
  chatInRoom,
  type ChatRoom,
  createRoomAndChat,
  deleteAdminChatRoom,
  getRoomMessages,
  getRooms,
  guestChat,
  type GuestHistoryMessage,
} from '@/api/chat';
import { MarkdownText } from '@/components/MarkdownText';
import { Recipe, RecipeCard } from '@/components/RecipeCard';
import { useAuthStore } from '@/stores/auth';

interface ChatPart {
  text: string;
}

interface ChatContent {
  role: 'user' | 'model';
  parts: ChatPart[];
  image?: string;
  recipes?: Recipe[];
}

function toGuestHistory(history: ChatContent[]): GuestHistoryMessage[] {
  return history
    .map(
      (message): GuestHistoryMessage => ({
        role: message.role === 'user' ? 'user' : 'assistant',
        content: message.parts.map(part => part.text).join(''),
        image: message.role === 'user' ? message.image : undefined,
      }),
    )
    .filter(message => message.content.trim() || message.image)
    .slice(-20);
}

export default function ChatPage() {
  const [prompt, setPrompt] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [history, setHistory] = useState<ChatContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const accessToken = useAuthStore(state => state.accessToken);
  const user = useAuthStore(state => state.user);
  const hasHydrated = useAuthStore(state => state.hasHydrated);
  const isDev = import.meta.env.DEV;
  const isAuthenticated =
    isDev || Boolean(accessToken && user?.role === 'ADMIN');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) return;

    getRooms().then(setRooms).catch(console.error);
  }, [hasHydrated, isAuthenticated]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  const handleSelectRoom = async (room: ChatRoom) => {
    if (isLoading || !isAuthenticated) return;
    setRoomId(room.room_id);
    setHistory([]);
    try {
      const messages = await getRoomMessages(room.room_id);
      setHistory(
        messages.map(m => ({
          role: m.role as 'user' | 'model',
          parts: [{ text: m.content }],
          image: m.image_url ?? undefined,
          recipes: m.recipes ?? undefined,
        })),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleNewChat = () => {
    if (isLoading) return;
    setRoomId(null);
    setHistory([]);
    setPrompt('');
    setImage(null);
  };

  const handleDeleteRoom = async (
    event: React.MouseEvent<HTMLButtonElement>,
    room: ChatRoom,
  ) => {
    event.stopPropagation();
    if (isLoading || deletingRoomId !== null || !isAuthenticated) return;
    const confirmed = window.confirm(
      `"${room.title}" 채팅방을 DB에서 완전히 삭제할까요?`,
    );
    if (!confirmed) return;

    setDeletingRoomId(room.room_id);
    try {
      await deleteAdminChatRoom(room.room_id);
      setRooms(prev => prev.filter(item => item.room_id !== room.room_id));
      if (roomId === room.room_id) {
        setRoomId(null);
        setHistory([]);
      }
    } catch (error) {
      console.error(error);
      alert('채팅방을 삭제하지 못했습니다.');
    } finally {
      setDeletingRoomId(null);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    if ((!prompt.trim() && !image) || isLoading || !hasHydrated) return;

    setIsLoading(true);
    const userPrompt = prompt;
    const userImage = image;
    const guestHistory = toGuestHistory(history);
    setPrompt('');
    setImage(null);

    setHistory(prev => [
      ...prev,
      {
        role: 'user',
        parts: [{ text: userPrompt }],
        image: userImage ?? undefined,
      },
    ]);

    try {
      let aiFullResponse = '';
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

      const callbacks = {
        onRoom: (id: number) => {
          setRoomId(id);
          setRooms(prev => [
            {
              room_id: id,
              title: userPrompt.slice(0, 100),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            ...prev,
          ]);
        },
        onMessage: (chunk: string) => {
          aiFullResponse += chunk;
          setHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              parts: [{ text: aiFullResponse }],
            };
            return next;
          });
        },
        onRecipes: (recipes: Recipe[]) => {
          setHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              recipes,
            };
            return next;
          });
        },
        onError: (_code: string, message: string) => {
          setHistory(prev => {
            const next = [...prev];
            next[next.length - 1] = {
              ...next[next.length - 1],
              parts: [{ text: `오류: ${message}` }],
            };
            return next;
          });
        },
      };

      if (!isAuthenticated) {
        await guestChat(
          userPrompt,
          callbacks,
          guestHistory,
          userImage ?? undefined,
        );
      } else if (roomId === null) {
        await createRoomAndChat(userPrompt, callbacks, userImage ?? undefined);
      } else {
        await chatInRoom(roomId, userPrompt, callbacks, userImage ?? undefined);
      }
    } catch (error) {
      console.error('채팅 중 에러 발생:', error);
      alert('AI와 대화 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Room list */}
      <aside className="flex w-56 flex-shrink-0 flex-col border-r border-(--color-light)">
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-(--color-main) px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-(--color-main-ui) disabled:opacity-50"
            disabled={isLoading}
          >
            <Plus size={15} />새 채팅
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {!isAuthenticated ? (
            <p className="px-3 py-4 text-center text-xs text-(--color-muted)">
              게스트 채팅은 이 브라우저 화면에서만 유지됩니다
            </p>
          ) : (
            rooms.map(room => (
              <div
                key={room.room_id}
                className={`group flex w-full items-center gap-2 rounded-xl pr-2 text-sm transition-colors ${
                  roomId === room.room_id
                    ? 'bg-(--color-light) font-semibold'
                    : 'hover:bg-(--color-lightest)'
                }`}
              >
                <button
                  type="button"
                  onClick={() => handleSelectRoom(room)}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left"
                >
                  <span className="block truncate">{room.title}</span>
                  <span className="mt-0.5 block text-xs text-(--color-muted)">
                    {new Date(room.updated_at).toLocaleDateString('ko-KR')}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={event => handleDeleteRoom(event, room)}
                  disabled={deletingRoomId === room.room_id}
                  className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-500 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 hover:bg-red-50 disabled:text-(--color-muted)"
                >
                  {deletingRoomId === room.room_id ? '삭제 중' : '삭제'}
                </button>
              </div>
            ))
          )}
          {isAuthenticated && rooms.length === 0 && (
            <p className="px-3 py-4 text-center text-xs text-(--color-muted)">
              채팅 내역이 없습니다
            </p>
          )}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div
          ref={scrollRef}
          className="min-h-100 flex-1 space-y-4 overflow-y-auto p-4"
        >
          {history.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-(--color-lighter) text-3xl shadow-sm">
                🍳
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-700">
                  냉장고 속 재료를 알려주세요
                </p>
                <p className="mt-1 text-sm text-(--color-muted)">
                  재료를 입력하면 딱 맞는 레시피를 추천해드릴게요!
                </p>
              </div>
            </div>
          )}
          {history.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col ${item.role === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                  item.role === 'user'
                    ? 'rounded-tr-sm bg-(--color-main) text-white'
                    : 'rounded-tl-sm bg-(--color-light) text-black'
                }`}
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt="첨부 이미지"
                    className="mb-2 max-h-48 rounded-xl object-cover"
                  />
                )}
                {item.parts.map((p, i) =>
                  item.role === 'model' ? (
                    <MarkdownText key={i} text={p.text} />
                  ) : (
                    <p key={i} className="whitespace-pre-wrap">
                      {p.text}
                    </p>
                  ),
                )}
              </div>
              {item.recipes && item.recipes.length > 0 && (
                <div className="mt-2 w-full space-y-2">
                  <p className="text-sm font-semibold text-(--color-gray)">
                    추천 레시피 {item.recipes.length}개
                  </p>
                  {item.recipes.map(recipe => (
                    <RecipeCard key={recipe.id} recipe={recipe} />
                  ))}
                </div>
              )}
            </div>
          ))}

          {isLoading && history[history.length - 1]?.role !== 'model' && (
            <div className="flex justify-start">
              <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-(--color-light) px-4 py-3">
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-(--color-main)"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-(--color-main)"
                  style={{ animationDelay: '150ms' }}
                />
                <span
                  className="h-2 w-2 animate-bounce rounded-full bg-(--color-main)"
                  style={{ animationDelay: '300ms' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-(--color-light) bg-white px-4 pt-3 pb-4">
          {image && (
            <div className="mb-2 flex items-center gap-2">
              <img
                src={image}
                alt="미리보기"
                className="h-16 w-16 rounded-xl object-cover ring-1 ring-(--color-light)"
              />
              <button
                onClick={() => setImage(null)}
                className="rounded-full px-2 py-0.5 text-xs font-semibold text-(--color-muted) hover:bg-red-50 hover:text-red-500"
              >
                ✕ 제거
              </button>
            </div>
          )}
          <div className="flex items-end gap-2 rounded-2xl border border-(--color-light) bg-(--color-lightest) px-3 py-2 transition-colors focus-within:border-(--color-main) focus-within:bg-white">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              title="이미지 첨부"
              className="mb-0.5 shrink-0 rounded-full p-1.5 text-(--color-gray) transition-colors hover:bg-(--color-lighter) hover:text-(--color-main) disabled:opacity-40"
            >
              <Image size={16} />
            </button>
            <textarea
              rows={1}
              className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm text-black placeholder:text-(--color-muted) focus:outline-none"
              placeholder="재료를 입력하세요 (예: 양배추, 계란)"
              value={prompt}
              onChange={e => {
                setPrompt(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = `${e.target.scrollHeight}px`;
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || (!prompt.trim() && !image)}
              className="mb-0.5 shrink-0 rounded-full bg-(--color-main-ui) p-2 text-white transition-colors hover:bg-(--color-main) disabled:bg-(--color-muted)"
              title="전송 (Enter)"
            >
              <Send size={15} />
            </button>
          </div>
          <p className="mt-1.5 text-center text-[10px] text-(--color-muted)">
            Enter로 전송, Shift+Enter로 줄바꿈
          </p>
        </div>
      </div>
    </div>
  );
}
