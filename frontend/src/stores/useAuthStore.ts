import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface User {
  cpf: string;
  // Add other user properties here
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User, token: string) => void;
  logout: () => void;
}

const useAuthStore = create(
  immer<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    login: (userData, token) =>
      set((state) => {
        state.user = userData;
        state.token = token;
        state.isAuthenticated = true;
      }),
    logout: () =>
      set((state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      }),
  })),
);

export default useAuthStore;