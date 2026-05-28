import { redirectToLogin } from '@/api/authRedirect';
import { ApiErrorBody } from '@/api/client';
import { useAuthStore } from '@/stores/auth';

async function getApiErrorBody(
  response: Response,
): Promise<ApiErrorBody | null> {
  try {
    return (await response.clone().json()) as ApiErrorBody;
  } catch {
    return null;
  }
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  const { accessToken } = useAuthStore.getState();

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const errorBody = await getApiErrorBody(response);
    if (errorBody?.error?.code === 'UNAUTHENTICATED' && !import.meta.env.DEV) {
      redirectToLogin();
    }
  }

  return response;
}
