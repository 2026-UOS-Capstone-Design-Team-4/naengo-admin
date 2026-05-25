import { Lock, LogIn, User } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { login } from '@/api/auth';
import { getApiErrorCode, getApiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

function getLoginErrorMessage(error: unknown) {
  const code = getApiErrorCode(error);
  if (code === 'INVALID_CREDENTIALS') {
    return '아이디 또는 비밀번호를 확인해주세요.';
  }
  if (code === 'USER_BLOCKED') {
    return '차단된 계정입니다.';
  }
  return getApiErrorMessage(error, '로그인하지 못했습니다.');
}

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore(state => state.setSession);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!username.trim() || !password || loading) return;

    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await login({
        username: username.trim(),
        password,
      });

      if (data.role !== 'ADMIN') {
        setErrorMessage('관리자 권한이 없습니다.');
        return;
      }

      setSession({
        accessToken: data.access_token,
        user: {
          user_id: data.user_id,
          nickname: data.nickname,
          role: data.role,
        },
      });
      navigate(searchParams.get('next') || '/admin/recipes', { replace: true });
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <main className="w-full max-w-sm rounded-xl border border-slate-200 bg-white px-6 py-7 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <img
            src="/favicon.svg"
            alt="냉고"
            className="h-10 w-10 rounded-lg shadow-sm"
          />
          <div>
            <h1 className="text-lg font-bold text-slate-950">냉고 관리자</h1>
            <p className="text-xs font-medium text-slate-400">Admin Login</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-500">
            아이디
            <span className="mt-1 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-(--color-main-ui)">
              <User size={15} className="text-slate-400" />
              <input
                value={username}
                onChange={event => setUsername(event.target.value)}
                autoComplete="username"
                className="min-w-0 flex-1 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="관리자 아이디"
              />
            </span>
          </label>

          <label className="block text-xs font-semibold text-slate-500">
            비밀번호
            <span className="mt-1 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-(--color-main-ui)">
              <Lock size={15} className="text-slate-400" />
              <input
                value={password}
                onChange={event => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="min-w-0 flex-1 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="비밀번호"
              />
            </span>
          </label>

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--color-main-ui) text-sm font-bold text-white transition-colors hover:bg-(--color-main) disabled:bg-slate-200 disabled:text-slate-400"
          >
            <LogIn size={15} />
            {loading ? '로그인 중' : '로그인'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          계정이 없나요?{' '}
          <Link
            to="/signup"
            className="font-bold text-(--color-main-ui) hover:underline"
          >
            회원가입
          </Link>
        </p>
      </main>
    </div>
  );
}
