import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { id: Theme; name: string; color: string }[] = [
    { id: 'dark', name: 'Dark', color: '#2DD6B6' },
    { id: 'light', name: 'Light', color: '#ffd700' },
    { id: 'blue', name: 'Blue', color: '#3b82f6' },
    { id: 'green', name: 'Green', color: '#10b981' },
    { id: 'purple', name: 'Purple', color: '#7F66F0' },
  ];

  const handleThemeChange = (selectedTheme: Theme) => {
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors"
        aria-label="Toggle theme switcher"
      >
        <Palette className="h-5 w-5 text-gray-300" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-400 px-2 py-1">THEMES</div>
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md ${
                    theme === t.id 
                      ? 'bg-tft-gold/10 text-tft-gold' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-tft-gold'
                  }`}
                >
                  <span className="flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: t.color }}
                    />
                    {t.name}
                  </span>
                  {theme === t.id && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ThemeSwitcher;