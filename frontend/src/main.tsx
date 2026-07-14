import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import { applyTheme, readDarkThemePreference } from './utils/theme';

const storedTheme = readDarkThemePreference();
if (storedTheme) {
  applyTheme(storedTheme);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);