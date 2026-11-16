import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

describe('ThemeContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    // Reset localStorage mock
    localStorage.getItem.mockReturnValue(null);
  });

  it('provides theme context to children', () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('light')}>Switch to Light</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
  });

  it('changes theme when setTheme is called', () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('light')}>Switch to Light</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Switch to Light'));
    
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
  });

  it('persists theme to localStorage', () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('earthy')}>Switch to Earthy</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    fireEvent.click(screen.getByText('Switch to Earthy'));
    
    expect(localStorage.setItem).toHaveBeenCalledWith('tft-theme', 'earthy');
  });

  it('loads theme from localStorage on mount', () => {
    localStorage.getItem.mockReturnValue('pastel');

    const TestComponent = () => {
      const { theme } = useTheme();
      return <span data-testid="theme">{theme}</span>;
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme')).toHaveTextContent('pastel');
  });

  it('applies theme to document element', () => {
    const TestComponent = () => {
      const { theme, setTheme } = useTheme();
      return (
        <div>
          <span data-testid="theme">{theme}</span>
          <button onClick={() => setTheme('sunset')}>Switch to Sunset</button>
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    
    fireEvent.click(screen.getByText('Switch to Sunset'));
    
    expect(document.documentElement.getAttribute('data-theme')).toBe('sunset');
  });

  it('throws error when useTheme used outside provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const TestComponent = () => {
      useTheme();
      return <div>Test</div>;
    };

    expect(() => render(<TestComponent />)).toThrow('useTheme must be used within a ThemeProvider');
    
    consoleError.mockRestore();
  });
});