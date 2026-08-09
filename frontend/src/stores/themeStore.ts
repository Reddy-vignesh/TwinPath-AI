import { create } from 'zustand';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('twinpath_theme');
  if (saved === 'dark' || saved === 'light') {
    return saved;
  }
  return 'dark'; // Default to Cybernetic Obsidian (Dark)
};

export const useThemeStore = create<ThemeState>((set, get) => {
  const initialTheme = getInitialTheme();
  
  if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', initialTheme);
  }

  return {
    theme: initialTheme,
    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme);
      }
      localStorage.setItem('twinpath_theme', nextTheme);
      set({ theme: nextTheme });
    },
    setTheme: (theme: ThemeMode) => {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', theme);
      }
      localStorage.setItem('twinpath_theme', theme);
      set({ theme });
    },
  };
});
