import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  user_id: number;
  nickname: string;
  role: 'ADMIN' | string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  hasHydrated: boolean;
  setSession: (session: { accessToken: string; user: AuthUser }) => void;
  clearAuth: () => void;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setSession: session =>
        set({
          accessToken: session.accessToken,
          user: session.user,
        }),
      clearAuth: () =>
        set({
          accessToken: null,
          user: null,
        }),
      setHasHydrated: hasHydrated => set({ hasHydrated }),
    }),
    {
      name: 'naengo-admin-auth',
      partialize: state => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
      onRehydrateStorage: () => state => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
