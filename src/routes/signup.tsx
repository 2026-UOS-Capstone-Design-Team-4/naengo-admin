import { Lock, User, UserPlus } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { signup } from '@/api/auth';
import { getApiErrorCode, getApiErrorMessage } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

function getSignupErrorMessage(error: unknown) {
  const code = getApiErrorCode(error);
  if (code === 'EMAIL_ALREADY_EXISTS') {
    return '이미 사용 중인 아이디입니다.';
  }
  if (code === 'NICKNAME_ALREADY_EXISTS') {
    return '이미 사용 중인 닉네임입니다.';
  }
  if (code === 'VALIDATION_FAILED') {
    return '입력값을 다시 확인해주세요.';
  }
  return getApiErrorMessage(error, '회원가입하지 못했습니다.');
}

function getClientValidationMessage(
  username: string,
  password: string,
  nickname: string,
) {
  const trimmedUsername = username.trim();
  const trimmedNickname = nickname.trim();
  if (trimmedUsername.length < 3 || trimmedUsername.length > 255) {
    return '아이디는 3~255자로 입력해주세요.';
  }
  if (password.length < 8 || password.length > 64) {
    return '비밀번호는 8~64자로 입력해주세요.';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return '비밀번호에는 영문과 숫자가 각각 1자 이상 필요합니다.';
  }
  if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
    return '닉네임은 2~20자로 입력해주세요.';
  }
  return null;
}

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore(state => state.setSession);
  const navigate = useNavigate();

  const validationMessage = useMemo(
    () => getClientValidationMessage(username, password, nickname),
    [username, password, nickname],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    const nextValidationMessage = getClientValidationMessage(
      username,
      password,
      nickname,
    );
    if (nextValidationMessage) {
      setErrorMessage(nextValidationMessage);
      setSuccessMessage(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const data = await signup({
        username: username.trim(),
        password,
        nickname: nickname.trim(),
      });

      if (data.role !== 'ADMIN') {
        setSuccessMessage(
          '회원가입이 완료되었습니다. 관리자 권한이 부여된 계정만 관리자 화면에 접근할 수 있습니다.',
        );
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
      navigate('/admin/recipes', { replace: true });
    } catch (error) {
      setErrorMessage(getSignupErrorMessage(error));
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
            <h1 className="text-lg font-bold text-slate-950">
              관리자 계정 생성
            </h1>
            <p className="text-xs font-medium text-slate-400">Admin Signup</p>
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
                placeholder="3자 이상 아이디"
              />
            </span>
          </label>

          <label className="block text-xs font-semibold text-slate-500">
            닉네임
            <span className="mt-1 flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-(--color-main-ui)">
              <UserPlus size={15} className="text-slate-400" />
              <input
                value={nickname}
                onChange={event => setNickname(event.target.value)}
                autoComplete="nickname"
                className="min-w-0 flex-1 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="2~20자 닉네임"
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
                autoComplete="new-password"
                className="min-w-0 flex-1 text-sm font-medium text-slate-950 outline-none placeholder:text-slate-400"
                placeholder="영문+숫자, 8자 이상"
              />
            </span>
          </label>

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {errorMessage}
            </p>
          )}
          {successMessage && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || Boolean(validationMessage)}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-(--color-main-ui) text-sm font-bold text-white transition-colors hover:bg-(--color-main) disabled:bg-slate-200 disabled:text-slate-400"
          >
            <UserPlus size={15} />
            {loading ? '가입 중' : '회원가입'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          이미 계정이 있나요?{' '}
          <Link
            to="/login"
            className="font-bold text-(--color-main-ui) hover:underline"
          >
            로그인
          </Link>
        </p>
      </main>
    </div>
  );
}
