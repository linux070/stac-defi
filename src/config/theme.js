// theme stac  configuration (i suffered a lil bit).

// ─── 60-30-10 Brand Palette ─────────────────────────────────────────────
// 60% Dominant   : #0B0F1A  (deep navy page bg)
// 30% Secondary  : #161B2A  (surface / cards)
// 10% Accent     : #7C6FFF  (brand purple — buttons, highlights)
// Supporting     : #94A3B8  (secondary text)
//                : #2DD4BF  (success teal)
// ─────────────────────────────────────────────────────────────────────────

export const lightTheme = {
  font: 'Outfit, Inter, system-ui, sans-serif',
  primaryColor: '#7C6FFF',
  focusColor: '#6B5CF7',
  text: {
    default: '#0f172a',
    subtle: '#475569',
    muted: '#94A3B8',
  },
  background: {
    default: '#f8fafc',
    secondary: '#f1f5f9',
    tertiary: '#e2e8f0',
  },
  border: {
    default: '#e2e8f0',
    subtle: '#f1f5f9',
  },
  buttons: {
    primary: {
      color: '#ffffff',
      background: '#7C6FFF',
      hover: {
        color: '#ffffff',
        background: '#6B5CF7',
      },
    },
    secondary: {
      color: '#0f172a',
      background: '#ffffff',
      hover: {
        color: '#0f172a',
        background: '#f1f5f9',
      },
    },
  },
  card: {
    background: 'rgba(255, 255, 255, 0.8)',
    border: '#e2e8f0',
    shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.08)',
  },
  success: '#2DD4BF',
};

export const darkTheme = {
  font: 'Outfit, Inter, system-ui, sans-serif',
  primaryColor: '#7C6FFF',
  focusColor: '#6B5CF7',
  text: {
    default: '#f1f5f9',
    subtle: '#94A3B8',
    muted: '#475569',
  },
  background: {
    default: '#0B0F1A',    // 60% — page bg
    secondary: '#161B2A',  // 30% — surface / card
    tertiary: '#1e2538',   // elevated surface
  },
  border: {
    default: 'rgba(124, 111, 255, 0.12)',
    subtle: 'rgba(124, 111, 255, 0.06)',
  },
  buttons: {
    primary: {
      color: '#ffffff',
      background: '#7C6FFF',
      hover: {
        color: '#ffffff',
        background: '#6B5CF7',
      },
    },
    secondary: {
      color: '#f1f5f9',
      background: '#161B2A',
      hover: {
        color: '#f1f5f9',
        background: '#1e2538',
      },
    },
  },
  card: {
    background: '#161B2A',
    border: 'rgba(124, 111, 255, 0.08)',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  },
  success: '#2DD4BF',
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

  // Brand colors
  root.style.setProperty('--color-brand', theme.primaryColor);
  root.style.setProperty('--color-success', theme.success);
};
