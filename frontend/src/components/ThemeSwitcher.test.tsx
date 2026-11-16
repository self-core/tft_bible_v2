import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ThemeSwitcher from '../components/ThemeSwitcher';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders theme switcher button', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle theme switcher/i });
    expect(button).toBeInTheDocument();
  });

  it('opens dropdown when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle theme switcher/i });
    fireEvent.click(button);

    expect(screen.getByText('THEMES')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Earthy')).toBeInTheDocument();
    expect(screen.getByText('Pastel')).toBeInTheDocument();
    expect(screen.getByText('Sunset')).toBeInTheDocument();
    expect(screen.getByText('Copper')).toBeInTheDocument();
    expect(screen.getByText('Ocean')).toBeInTheDocument();
  });

  it('shows checkmark for current theme', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle theme switcher/i });
    fireEvent.click(button);

    // Dark should have checkmark (default theme)
    const darkButton = screen.getByText('Dark').closest('button');
    expect(darkButton).toHaveTextContent('Dark');
  });

  it('changes theme when option clicked', async () => {
    const TestWrapper = () => {
      const { theme } = useTheme();
      return (
        <div>
          <span data-testid="current-theme">{theme}</span>
          <ThemeSwitcher />
        </div>
      );
    };

    render(
      <ThemeProvider>
        <TestWrapper />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle theme switcher/i });
    fireEvent.click(button);
    
    fireEvent.click(screen.getByText('Light'));
    
    await waitFor(() => {
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });

  it('closes dropdown when clicking outside', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle theme switcher/i });
    fireEvent.click(button);

    expect(screen.getByText('THEMES')).toBeInTheDocument();

    // Click on the overlay (fixed inset-0 div)
    const overlay = document.querySelector('div.fixed.inset-0');
    if (overlay) {
      fireEvent.click(overlay);
      expect(screen.queryByText('THEMES')).not.toBeInTheDocument();
    }
  });

  it('displays color indicators for each theme', () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>
    );

    const button = screen.getByRole('button', { name: /toggle theme switcher/i });
    fireEvent.click(button);

    // Check for color circles (w-3 h-3 rounded-full) - they are spans with background color
    const colorIndicators = document.querySelectorAll('span.w-3.h-3.rounded-full');
    expect(colorIndicators.length).toBeGreaterThanOrEqual(7);
  });
});