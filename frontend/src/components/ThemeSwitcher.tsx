import React, { useState } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, Theme } from '../contexts/ThemeContext';

const ThemeSwitcher = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes: { id: Theme; name: string; color: string }[] = [
    { id: 'dark', name: 'Dark', color: '#2DD6B6' },
    { id: 'light', name: 'Light', color: '#ffd700' },
    { id: 'earthy', name: 'Earthy', color: '#283618' },  // From https://coolors.co/palette/606c38-283618-fefae0-dda15e-bc6c25
    { id: 'pastel', name: 'Pastel', color: '#CDB4DB' },  // From https://coolors.co/palette/cdb4db-ffc8dd-ffafcc-bde0fe-a2d2ff
    { id: 'sunset', name: 'Sunset', color: '#FF6B35' },  // Representative color from https://coolors.co/palette/ffcdb2-ffb4a2-e5989b-b5838d-6d6875
    { id: 'copper', name: 'Copper', color: '#BC6C25' },  // From https://coolors.co/palette/606c38-283618-fefae0-dda15e-bc6c25
    { id: 'ocean', name: 'Ocean', color: '#2A9D8F' },   // From https://coolors.co/palette/264653-2a9d8f-e9c46a-f4a261-e76f51
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
              {themes.map(({ id, name, color }) => (
                <button
                  key={id}
                  onClick={() => handleThemeChange(id)}
                  className={`flex items-center justify-between w-full px-3 py-2 text-sm rounded-md ${
                    theme === id 
                      ? 'bg-tft-gold/10 text-tft-gold' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-tft-gold'
                  }`}
                >
                  <span className="flex items-center">
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: color }}
                    />
                    {name}
                  </span>
                  {theme === id && <Check className="h-4 w-4" />}
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