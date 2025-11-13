import { create } from 'zustand';
import { isAuthenticated, logoutUser } from '../api/authApi';
import { checkAdminStatus } from '../api/eventsAPI';

export const useAuthStore = create((set, get) => ({
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  user: null,

  checkAuth: async () => {
    try {
      const response = await isAuthenticated();
      set({
        loading: false,
        isAuthenticated: response.success === true,
        user: response.user || null,
      });

      // If authenticated, check admin status
      if (response.success) {
        await get().checkAdmin();
      }
    } catch {
      set({
        loading: false,
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      });
    }
  },

  checkAdmin: async () => {
    try {
      const response = await checkAdminStatus();
      if (response.success) {
        set({ isAdmin: response.isAdmin });
      } else {
        set({ isAdmin: false });
      }
      return response;
    } catch {
      set({ isAdmin: false });
      return { success: false, isAdmin: false };
    }
  },

  logout: async () => {
    try {
      const response = await logoutUser();
      if (response.success) {
        set({
          isAuthenticated: false,
          isAdmin: false,
          user: null,
        });
      }
      return response;
    } catch {
      set({
        isAuthenticated: false,
        isAdmin: false,
        user: null,
      });
      return { success: false, message: 'Logout failed' };
    }
  },
}));
