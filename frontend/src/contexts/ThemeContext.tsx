import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define theme types
export type Theme = 'light' | 'dark' | 'blue' | 'green' | 'purple';

// Define the theme context type
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider component
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>('dark');

  // Load theme from localStorage on initial render
  useEffect(() => {
    const savedTheme = localStorage.getItem('tft-theme') as Theme | null;
    if (savedTheme && ['light', 'dark', 'blue', 'green', 'purple'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('tft-theme', theme);
    
    // Apply theme CSS variables to document root
    const root = document.documentElement;
    
    switch (theme) {
      case 'light':
        root.style.setProperty('--bg-primary', '#ffffff');
        root.style.setProperty('--bg-secondary', '#f3f4f6');
        root.style.setProperty('--text-primary', '#111827');
        root.style.setProperty('--accent1', '#ffd700');
        break;
      case 'dark':
        root.style.setProperty('--bg-primary', '#0a0a0b');
        root.style.setProperty('--bg-secondary', '#141518');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--accent1', '#2DD6B6');
        break;
      case 'blue':
        root.style.setProperty('--bg-primary', '#0c4a6e');
        root.style.setProperty('--bg-secondary', '#0369a1');
        root.style.setProperty('--text-primary', '#e0f2fe');
        root.style.setProperty('--accent1', '#3b82f6');
        break;
      case 'green':
        root.style.setProperty('--bg-primary', '#052e16');
        root.style.setProperty('--bg-secondary', '#064e3b');
        root.style.setProperty('--text-primary', '#dcfce7');
        root.style.setProperty('--accent1', '#10b981');
        break;
      case 'purple':
        root.style.setProperty('--bg-primary', '#312e81');
        root.style.setProperty('--bg-secondary', '#3730a3');
        root.style.setProperty('--text-primary', '#e0e7ff');
        root.style.setProperty('--accent1', '#7F66F0');
        break;
    }
  }, [theme]);

  const value = {
    theme,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook to use the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};