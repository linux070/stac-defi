import React, { createContext, useContext, useState, useEffect } from 'react';
import { lightTheme, darkTheme, applyThemeVariables } from '../config/theme';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Helper function to apply theme immediately (synchronously)
  const applyThemeImmediately = (isDark) => {
    const theme = isDark ? darkTheme : lightTheme;
    
    // Apply CSS variables immediately
    applyThemeVariables(theme);
    
    // Apply Tailwind dark class immediately
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Save preference
    localStorage.setItem('darkMode', JSON.stringify(isDark));
  };

  // Initialize theme with system preference detection
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first (user preference)
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      const isDark = JSON.parse(saved);
      // Apply immediately on initialization for mobile
      if (typeof document !== 'undefined') {
        applyThemeImmediately(isDark);
      }
      return isDark;
    }
    
    // Fall back to system preference if no saved preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // Apply immediately on initialization for mobile
      if (typeof document !== 'undefined') {
        applyThemeImmediately(isDark);
      }
      return isDark;
    }
    
    // Default to light mode
    if (typeof document !== 'undefined') {
      applyThemeImmediately(false);
    }
    return false;
  });

  // Apply theme changes on mount and when darkMode changes (fallback for initial load)
  useEffect(() => {
    applyThemeImmediately(darkMode);
  }, [darkMode]);

  // Listen for system preference changes (only if user hasn't set a preference)
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const saved = localStorage.getItem('darkMode');
    
    // Only auto-update if user hasn't manually set a preference
    const handleChange = (e) => {
      if (saved === null) {
        setDarkMode(e.matches);
      }
    };
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Fallback for older browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newValue = !prev;
      // Apply changes synchronously for instant theme switch
      applyThemeImmediately(newValue);
      return newValue;
    });
  };

  const setTheme = (isDark) => {
    // Apply changes synchronously for instant theme switch
    applyThemeImmediately(isDark);
    setDarkMode(isDark);
  };

  return (
    <ThemeContext.Provider value={{ 
      darkMode, 
      toggleDarkMode, 
      setTheme,
      theme: darkMode ? darkTheme : lightTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
