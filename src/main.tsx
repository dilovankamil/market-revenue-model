import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './styles.css';
import './enhancements.css';
import './open-country.css';
import './build-mode.css';
import './ux-v2.css';
import './responsive-v3.css';
import './runtime-hotfix.css';

const privateModulesEnabled = import.meta.env.VITE_SHOW_PRIVATE_MODULES === 'true';
document.documentElement.classList.toggle('internal-build', privateModulesEnabled);
document.documentElement.classList.toggle('public-build', !privateModulesEnabled);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Application root element is missing.');

try {
  createRoot(rootElement).render(
    createElement(
      StrictMode,
      null,
      createElement(AppErrorBoundary, null, createElement(App)),
    ),
  );
} catch (error) {
  console.error('SI-053 application bootstrap failed', error);
  rootElement.innerHTML = `
    <div class="app-boot-error" role="alert">
      <strong>The model could not start in this browser.</strong>
      <span>Please refresh the page. If the problem remains, try an up-to-date Chrome, Safari, Edge or Firefox browser.</span>
      <small>Error code: SI053-BOOT-1</small>
    </div>
  `;
}
