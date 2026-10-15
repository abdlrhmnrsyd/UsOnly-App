import { create } from 'zustand';
import { authApi } from '../api/endpoints.js';

export const useAuthStore = create((set, get) => ({
  user: null,
  partner: null,
  space: null,
  token: localStorage.getItem('our_space_token') || null,
  isLoading: !!localStorage.getItem('our_space_token'),
  isAuthenticated: !!localStorage.getItem('our_space_token'),

  setToken: (token) => {
    if (token) {
      localStorage.setItem('our_space_token', token);
      set({ token, isAuthenticated: true });
    } else {
      localStorage.removeItem('our_space_token');
      set({ token: null, isAuthenticated: false, user: null, partner: null, space: null });
    }
  },

  checkAuth: async (silent = false) => {
    const token = localStorage.getItem('our_space_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false, user: null });
      return false;
    }

    try {
      if (!silent && !get().user) {
        set({ isLoading: true });
      }
      const res = await authApi.getMe();
      if (res.success) {
        set({
          user: res.user,
          partner: res.partner,
          space: res.space,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }
    } catch (err) {
      console.warn('[Auth Check Error]', err.message);
      get().logout();
    } finally {
      if (!silent) {
        set({ isLoading: false });
      }
    }
    return false;
  },

  login: async (credentials) => {
    const res = await authApi.login(credentials);
    if (res.success) {
      get().setToken(res.token);
      set({ user: res.user });
      await get().checkAuth();
    }
    return res;
  },

  register: async (data) => {
    const res = await authApi.register(data);
    if (res.success) {
      get().setToken(res.token);
      set({ user: res.user });
      await get().checkAuth();
    }
    return res;
  },

  quickLogin: async (role) => {
    const res = await authApi.quickLogin(role);
    if (res.success) {
      get().setToken(res.token);
      set({ user: res.user });
      await get().checkAuth();
    }
    return res;
  },

  logout: () => {
    get().setToken(null);
  },

  updateUser: (updates) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    }));
  },

  setSpace: (space, partner = null) => {
    set((state) => ({
      space,
      partner: partner || state.partner,
      user: state.user ? { ...state.user, space_id: space?.id || null } : null,
    }));
  },
}));
