import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '../api/client';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCredentials: (user: User | null, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  refresh: () => Promise<void>;
  fetchUser: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

// Helper: map snake_case user data from backend to camelCase
function mapUser(data: any): User {
  return {
    id: data.id,
    email: data.email,
    firstName: data.first_name ?? data.firstName ?? '',
    lastName: data.last_name ?? data.lastName ?? '',
    role: data.role,
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setCredentials: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true, error: null });
      },

      logout: () => {
        const refreshToken = get().refreshToken;
        // Clear state first so UI updates immediately
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, error: null });
        // Invalidate the refresh token on the server (best-effort)
        if (refreshToken) {
          apiClient.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
        }
      },

      deleteAccount: async () => {
        set({ isLoading: true });
        try {
          await apiClient.delete('/auth/me');
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, error: null });
        } catch (error: any) {
          let msg = 'Failed to delete account';
          if (error.response?.data) {
            const data = error.response.data;
            if (data.message) {
              msg = data.message;
            } else if (data.detail) {
              if (Array.isArray(data.detail)) {
                msg = data.detail.map((d: any) => d.msg).join(', ');
              } else {
                msg = data.detail;
              }
            }
          }
          set({ error: msg });
          throw new Error(msg);
        } finally {
          set({ isLoading: false });
        }
      },

      refresh: async () => {
        const refreshToken = get().refreshToken;
        if (!refreshToken) {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          throw new Error('No refresh token available');
        }
        try {
          const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
          const { access_token, refresh_token } = response.data.data;
          set({
            accessToken: access_token,
            refreshToken: refresh_token ?? refreshToken, // use new one if returned
            isAuthenticated: true,
          });
        } catch (error) {
          set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
          throw error;
        }
      },

      fetchUser: async () => {
        if (!get().accessToken) return;

        set({ isLoading: true });
        try {
          const response = await apiClient.get('/auth/me');
          const user = mapUser(response.data.data);
          set({ user, isAuthenticated: true, error: null });
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Failed to fetch user' });
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      // Persist tokens and auth state across page refreshes
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
