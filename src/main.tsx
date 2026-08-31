import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
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

const privateModulesEnabled = import.meta.env.VITE_SHOW_PRIVATE_MODULES === 'true';
document.documentElement.classList.toggle('internal-build', privateModulesEnabled);
document.documentElement.classList.toggle('public-build', !privateModulesEnabled);

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Application root element is missing.');

rootElement.innerHTML = '<div class="app-boot-status"><strong>Loading SI-053 Strategic Model…</strong></div>';

import('./AppV9')
  .then(({ default: App }) => {
    rootElement.replaceChildren();
    createRoot(rootElement).render(
      createElement(
        StrictMode,
        null,
        createElement(AppErrorBoundary, null, createElement(App)),
      ),
    );
  })
  .catch((error) => {
    console.error('SI-053 application module failed to load', error);
    rootElement.innerHTML = `
      <div class="app-boot-error" role="alert">
        <strong>The model could not start.</strong>
        <span>The application bundle loaded, but a model module failed during startup. Reload once; if this remains, use the release link with a fresh version parameter.</span>
        <small>Error code: SI053-MODULE-1</small>
      </div>
    `;
  });
