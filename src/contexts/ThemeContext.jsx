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

  // Initialize theme: Default to Light Mode for new users
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first (user preference)
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      const isDark = JSON.parse(saved);
      // Apply immediately on initialization
      if (typeof document !== 'undefined') {
        applyThemeImmediately(isDark);
      }
      return isDark;
    }

    // Default to light mode (false) for new users, ignoring system preference
    if (typeof document !== 'undefined') {
      applyThemeImmediately(false);
    }
    return false;
  });

  // Apply theme changes on mount and when darkMode changes (fallback for initial load)
  useEffect(() => {
    applyThemeImmediately(darkMode);
  }, [darkMode]);



  const toggleDarkMode = () => {
    // Add a temporary style to disable all transitions for instant theme switch
    const disableTransitions = document.createElement('style');
    disableTransitions.innerHTML = `
      * {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(disableTransitions);

    setDarkMode((prev) => {
      const newValue = !prev;
      applyThemeImmediately(newValue);

      // Remove the style after a brief delay to re-enable transitions for other interactions
      // Using requestAnimationFrame to ensure it happens after the next paint
      requestAnimationFrame(() => {
        // Double RAF to be extra sure the theme has applied without transitions
        requestAnimationFrame(() => {
          if (document.head.contains(disableTransitions)) {
            document.head.removeChild(disableTransitions);
          }
        });
      });

      return newValue;
    });
  };

  const setTheme = (isDark) => {
    // Same immediate logic for direct set
    const disableTransitions = document.createElement('style');
    disableTransitions.innerHTML = `
      * {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
      }
    `;
    document.head.appendChild(disableTransitions);

    applyThemeImmediately(isDark);
    setDarkMode(isDark);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (document.head.contains(disableTransitions)) {
          document.head.removeChild(disableTransitions);
        }
      });
    });
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
