import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeTestPage = () => {
  const { theme, setTheme } = useTheme();

  const themes = [
    { id: 'dark', name: 'Dark', color: '#2DD6B6' },
    { id: 'light', name: 'Light', color: '#ffd700' },
    { id: 'earthy', name: 'Earthy', color: '#283618' },
    { id: 'pastel', name: 'Pastel', color: '#CDB4DB' },
    { id: 'sunset', name: 'Sunset', color: '#FF6B35' },
    { id: 'copper', name: 'Copper', color: '#BC6C25' },
    { id: 'ocean', name: 'Ocean', color: '#2A9D8F' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Themes</h1>
        <p className="text-gray-600 mb-6">
          Current theme: <span className="font-semibold text-tft-gold">{theme}</span>
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Theme Selector</h2>
            <div className="flex flex-wrap gap-3">
              {themes.map(({ id, name, color }) => (
                <button
                  key={id}
                  onClick={() => setTheme(id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    theme === id
                      ? 'bg-tft-gold text-gray-900'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Theme Preview</h2>
            <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
              <p className="mb-2">This text uses CSS variables for theme colors.</p>
              <p className="text-sm opacity-75">Background: var(--bg-primary)</p>
              <p className="text-sm opacity-75">Text: var(--text-primary)</p>
              <p className="text-sm opacity-75">Accent: <span style={{ color: 'var(--accent1)' }}>var(--accent1)</span></p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Theme Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="h-16 rounded-lg mb-2 bg-tft-gold"></div>
            <p className="text-sm font-medium">Gold</p>
            <p className="text-xs text-gray-500">#ffd700</p>
          </div>
          <div className="text-center">
            <div className="h-16 rounded-lg mb-2 bg-tft-blue"></div>
            <p className="text-sm font-medium">Blue</p>
            <p className="text-xs text-gray-500">#3b82f6</p>
          </div>
          <div className="text-center">
            <div className="h-16 rounded-lg mb-2 bg-tft-green"></div>
            <p className="text-sm font-medium">Green</p>
            <p className="text-xs text-gray-500">#10b981</p>
          </div>
          <div className="text-center">
            <div className="h-16 rounded-lg mb-2 bg-tft-red"></div>
            <p className="text-sm font-medium">Red</p>
            <p className="text-xs text-gray-500">#ef4444</p>
          </div>
          <div className="text-center">
            <div className="h-16 rounded-lg mb-2" style={{ backgroundColor: 'var(--accent1)' }}></div>
            <p className="text-sm font-medium">Accent</p>
            <p className="text-xs text-gray-500">var(--accent1)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeTestPage;