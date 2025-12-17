// Hook to access theme tokens directly (theme system)
import { useTheme } from '../contexts/ThemeContext';

/**
 * Hook to access theme tokens and utilities
 * 
 * @returns {Object} Theme tokens and utilities
 * 
 * @example
 * const { colors, text, background, buttons } = useThemeTokens();
 * 
 * // Use in inline styles
 * <div style={{ color: text.default, backgroundColor: background.default }}>
 * 
 * // Or use Tailwind classes with CSS variables
 * <div className="text-theme-text-default bg-theme-bg-default">
 */
export const useThemeTokens = () => {
  const { theme, darkMode } = useTheme();

  return {
    // Current theme object
    theme,
    
    // Dark mode state
    isDark: darkMode,
    
    // Quick access to colors
    colors: {
      primary: theme.primaryColor,
      focus: theme.focusColor,
    },
    
    // Text colors
    text: theme.text,
    
    // Background colors
    background: theme.background,
    
    // Border colors
    border: theme.border,
    
    // Button styles
    buttons: theme.buttons,
    
    // Card styles
    card: theme.card,
    
    // Font
    font: theme.font,
    
    // Helper function to get CSS variable value
    getCSSVariable: (name) => {
      return getComputedStyle(document.documentElement)
        .getPropertyValue(`--theme-${name}`)
        .trim();
    },
  };
};
