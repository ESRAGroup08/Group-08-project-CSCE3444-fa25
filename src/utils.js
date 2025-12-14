import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function applyTheme(theme) {
  const root = document.documentElement;
  try {
    switch (theme) {
      case 'light':
        root.style.setProperty('--bg-primary', '#f5f5f5');
        root.style.setProperty('--bg-secondary', '#ffffff');
        root.style.setProperty('--bg-tertiary', '#e0e0e0');
        root.style.setProperty('--text-primary', '#000000');
        root.style.setProperty('--text-secondary', '#333333');
        root.style.setProperty('--accent', '#0066cc');
        document.body.style.backgroundColor = '#f5f5f5';
        document.body.style.color = '#000000';
        break;
      case 'neon':
        root.style.setProperty('--bg-primary', '#0a0e27');
        root.style.setProperty('--bg-secondary', '#1a1f3a');
        root.style.setProperty('--bg-tertiary', '#2d3561');
        root.style.setProperty('--text-primary', '#00ff88');
        root.style.setProperty('--text-secondary', '#00ffff');
        root.style.setProperty('--accent', '#ff00ff');
        document.body.style.backgroundColor = '#0a0e27';
        document.body.style.color = '#00ff88';
        break;
      default:
        root.style.setProperty('--bg-primary', '#111827');
        root.style.setProperty('--bg-secondary', '#1f2937');
        root.style.setProperty('--bg-tertiary', '#374151');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#d1d5db');
        root.style.setProperty('--accent', '#06b6d4');
        document.body.style.backgroundColor = '#111827';
        document.body.style.color = '#ffffff';
        break;
    }
  } catch (e) {
    // Fail silently if DOM isn't ready
    // (e.g., server-side rendering or early call)
    // eslint-disable-next-line no-console
    console.warn('applyTheme failed', e);
  }
}
