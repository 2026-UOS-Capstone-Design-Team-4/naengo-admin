import axios from 'axios';

import { redirectToLogin } from '@/api/authRedirect';
import { useAuthStore } from '@/stores/auth';

export interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
}

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipAuthRedirect?: boolean;
  }
}

const client = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL ?? ''}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use(config => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  response => response,
  error => {
    if (
      axios.isAxiosError<ApiErrorBody>(error) &&
      error.response?.data?.error?.code === 'UNAUTHENTICATED' &&
      !error.config?.skipAuthRedirect
    ) {
      redirectToLogin();
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error?.message ?? fallback;
  }
  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (axios.isAxiosError<ApiErrorBody>(error)) {
    return error.response?.data?.error?.code;
  }
  return undefined;
}

export default client;
