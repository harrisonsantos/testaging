import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

type Theme = 'light' | 'dark';

interface UIState {
  isLoading: boolean;
  theme: Theme;
  setLoading: (isLoading: boolean) => void;
  toggleTheme: () => void;
}

const useUIStore = create(
  immer<UIState>((set) => ({
    isLoading: false,
    theme: 'light',
    setLoading: (isLoading) =>
      set((state) => {
        state.isLoading = isLoading;
      }),
    toggleTheme: () =>
      set((state) => {
        state.theme = state.theme === 'light' ? 'dark' : 'light';
      }),
  })),
);

export default useUIStore;