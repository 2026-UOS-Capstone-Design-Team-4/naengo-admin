import axios from 'axios';

const AUTH_BASE_URL = import.meta.env.VITE_AUTH_API_URL || '/auth-api';

const authClient = axios.create({
  baseURL: AUTH_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  user_id: number;
  nickname: string;
  role: 'ADMIN' | string;
  access_token: string;
}

export interface SignupPayload {
  username: string;
  password: string;
  nickname: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await authClient.post<AuthResponse>('/auth/login', payload);
  return data;
}

export async function signup(payload: SignupPayload): Promise<AuthResponse> {
  const { data } = await authClient.post<AuthResponse>('/auth/signup', payload);
  return data;
}
