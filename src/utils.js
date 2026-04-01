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
        root.style.setProperty('--bg-primary', 'transparent');
        root.style.setProperty('--bg-secondary', 'rgba(255, 255, 255, 0.4)');
        root.style.setProperty('--bg-tertiary', 'rgba(224, 224, 224, 0.4)');
        root.style.setProperty('--text-primary', '#000000');
        root.style.setProperty('--text-secondary', '#333333');
        root.style.setProperty('--accent', '#0066cc');
        document.body.style.backgroundColor = 'transparent';
        document.body.style.color = '#000000';
        break;
      case 'neon':
        root.style.setProperty('--bg-primary', 'transparent');
        root.style.setProperty('--bg-secondary', 'rgba(26, 31, 58, 0.4)');
        root.style.setProperty('--bg-tertiary', 'rgba(45, 53, 97, 0.4)');
        root.style.setProperty('--text-primary', '#00ff88');
        root.style.setProperty('--text-secondary', '#00ffff');
        root.style.setProperty('--accent', '#ff00ff');
        document.body.style.backgroundColor = 'transparent';
        document.body.style.color = '#00ff88';
        break;
      default:
        root.style.setProperty('--bg-primary', 'transparent'); // Changed to transparent
        root.style.setProperty('--bg-secondary', 'rgba(31, 41, 55, 0.4)');
        root.style.setProperty('--bg-tertiary', 'rgba(55, 65, 81, 0.4)');
        root.style.setProperty('--text-primary', '#ffffff');
        root.style.setProperty('--text-secondary', '#d1d5db');
        root.style.setProperty('--accent', '#06b6d4');
        document.body.style.backgroundColor = 'transparent'; 
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
