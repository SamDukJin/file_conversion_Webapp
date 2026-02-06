import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

export function useTheme() {
   const [theme, setTheme] = useState<Theme>(() => {
      // Check localStorage first
      const stored = localStorage.getItem('theme') as Theme | null;
      if (stored === 'light' || stored === 'dark') {
         return stored;
      }
      // Fall back to system preference
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
         return 'dark';
      }
      return 'light';
   });

   // Apply theme to document
   useEffect(() => {
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
   }, [theme]);

   // Listen for system preference changes
   useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
         const stored = localStorage.getItem('theme');
         if (!stored) {
            setTheme(e.matches ? 'dark' : 'light');
         }
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
   }, []);

   const toggleTheme = useCallback(() => {
      setTheme(prev => prev === 'dark' ? 'light' : 'dark');
   }, []);

   return { theme, setTheme, toggleTheme };
}
