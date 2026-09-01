import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './AppV9';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './styles.css';
import './enhancements.css';
import './build-mode.css';
import './ux-v2.css';
import './responsive-v3.css';
import './runtime-hotfix.css';
import './model-v5.css';
import './model-v7.css';
import './mobile-v8.css';
import './clean-v9.css';
import './story-v16.css';
import './story-calibration.css';

const privateModulesEnabled = import.meta.env.VITE_SHOW_PRIVATE_MODULES === 'true';
document.documentElement.classList.toggle('internal-build', privateModulesEnabled);
document.documentElement.classList.toggle('public-build', !privateModulesEnabled);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Application root element is missing.');

try {
  rootElement.replaceChildren();
  createRoot(rootElement).render(
    createElement(
      StrictMode,
      null,
      createElement(AppErrorBoundary, null, createElement(App)),
    ),
  );
  (window as Window & { __SI053_BOOT_OK__?: boolean }).__SI053_BOOT_OK__ = true;
} catch (error) {
  console.error('SI-053 application bootstrap failed', error);
  rootElement.innerHTML = `
    <div class="app-boot-error" role="alert">
      <strong>The model could not start.</strong>
      <span>The application loaded but failed while mounting the interface.</span>
      <small>Error code: SI053-MOUNT-2</small>
    </div>
  `;
}
