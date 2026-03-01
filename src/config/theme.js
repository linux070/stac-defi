// theme stac  configuration (i suffered a lil bit).
export const lightTheme = {
  font: 'Inter, system-ui, sans-serif',
  primaryColor: '#000000',
  focusColor: '#374151',
  text: {
    default: '#111827',
    subtle: '#6b7280',
    muted: '#9ca3af',
  },
  background: {
    default: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
  border: {
    default: '#e5e7eb',
    subtle: '#f3f4f6',
  },
  buttons: {
    primary: {
      color: '#ffffff',
      background: '#000000',
      hover: {
        color: '#ffffff',
        background: '#374151',
      },
    },
    secondary: {
      color: '#000000',
      background: '#ffffff',
      hover: {
        color: '#111827',
        background: '#f9fafb',
      },
    },
  },
  card: {
    background: '#ffffff',
    border: '#e5e7eb',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  },
};

export const darkTheme = {
  font: 'Inter, system-ui, sans-serif',
  primaryColor: '#ffffff',
  focusColor: '#d1d5db',
  text: {
    default: '#f9fafb',
    subtle: '#d1d5db',
    muted: '#9ca3af',
  },
  background: {
    default: '#020617',
    secondary: '#0f172a',
    tertiary: '#1e293b',
  },
  border: {
    default: '#334155',
    subtle: '#1e293b',
  },
  buttons: {
    primary: {
      color: '#020617',
      background: '#ffffff',
      hover: {
        color: '#020617',
        background: '#e5e7eb',
      },
    },
    secondary: {
      color: '#ffffff',
      background: '#1e293b',
      hover: {
        color: '#f3f4f6',
        background: '#334155',
      },
    },
  },
  card: {
    background: '#0f172a',
    border: '#1e293b',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
  },
};

// Helper function to apply theme CSS variables
export const applyThemeVariables = (theme) => {
  const root = document.documentElement;

  // Font
  root.style.setProperty('--theme-font', theme.font);

  // Colors (Main)
  root.style.setProperty('--theme-primary', theme.primaryColor);
  root.style.setProperty('--theme-focus', theme.focusColor);

  // Compatibility with index.css variables
  root.style.setProperty('--theme-accent-primary', theme.primaryColor);
  root.style.setProperty('--theme-accent-secondary', theme.primaryColor); // Fallback

  // Text colors
  root.style.setProperty('--theme-text-default', theme.text.default);
  root.style.setProperty('--theme-text-subtle', theme.text.subtle);
  root.style.setProperty('--theme-text-muted', theme.text.muted);

  // Compatibility with index.css text variables
  root.style.setProperty('--theme-text-primary', theme.text.default);
  root.style.setProperty('--theme-text-secondary', theme.text.subtle);

  // Background colors
  root.style.setProperty('--theme-bg-default', theme.background.default);
  root.style.setProperty('--theme-bg-secondary', theme.background.secondary);
  root.style.setProperty('--theme-bg-tertiary', theme.background.tertiary);

  // Compatibility with index.css background variables
  root.style.setProperty('--theme-bg-page', theme.background.default);
  root.style.setProperty('--theme-bg-surface', theme.background.default);
  root.style.setProperty('--theme-bg-card', theme.card.background);

  // Border colors
  root.style.setProperty('--theme-border-default', theme.border.default);
  root.style.setProperty('--theme-border-subtle', theme.border.subtle);

  // Compatibility with index.css border variables
  root.style.setProperty('--theme-border-medium', theme.border.default);
  root.style.setProperty('--theme-border-soft', theme.border.subtle);

  // Button colors
  root.style.setProperty('--theme-btn-primary-color', theme.buttons.primary.color);
  root.style.setProperty('--theme-btn-primary-bg', theme.buttons.primary.background);
  root.style.setProperty('--theme-btn-primary-hover-color', theme.buttons.primary.hover.color);
  root.style.setProperty('--theme-btn-primary-hover-bg', theme.buttons.primary.hover.background);

  root.style.setProperty('--theme-btn-secondary-color', theme.buttons.secondary.color);
  root.style.setProperty('--theme-btn-secondary-bg', theme.buttons.secondary.background);
  root.style.setProperty('--theme-btn-secondary-hover-color', theme.buttons.secondary.hover.color);
  root.style.setProperty('--theme-btn-secondary-hover-bg', theme.buttons.secondary.hover.background);

  // Card colors
  root.style.setProperty('--theme-card-bg', theme.card.background);
  root.style.setProperty('--theme-card-border', theme.card.border);
  root.style.setProperty('--theme-card-shadow', theme.card.shadow);
};
