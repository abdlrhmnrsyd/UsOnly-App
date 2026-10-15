import { create } from 'zustand';

const initialTheme = localStorage.getItem('our_space_theme') || 'dark';

if (initialTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

export const useThemeStore = create((set, get) => ({
  theme: initialTheme,

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('our_space_theme', nextTheme);
    set({ theme: nextTheme });
  },

  setTheme: (theme) => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('our_space_theme', theme);
    set({ theme });
  },
}));
