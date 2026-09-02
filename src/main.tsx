import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AppErrorBoundary } from './components/AppErrorBoundary';
import './app.css';

const privateModulesEnabled = import.meta.env.VITE_SHOW_PRIVATE_MODULES === 'true';
document.documentElement.classList.toggle('internal-build', privateModulesEnabled);
document.documentElement.classList.toggle('public-build', !privateModulesEnabled);

const scrollToPageStart = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
const scheduleSectionScrollReset = () => {
  queueMicrotask(scrollToPageStart);
  window.requestAnimationFrame(() => {
    scrollToPageStart();
    window.requestAnimationFrame(scrollToPageStart);
  });
};

// Section changes replace a 700+ vh story with a normal dashboard page. Reset
// after React commits so the new page never inherits the story's final scroll.
if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
scrollToPageStart();
document.addEventListener('click', (event) => {
  const target = event.target;
  if (target instanceof Element && target.closest('.nav-button, .si-cinema-actions button')) {
    scheduleSectionScrollReset();
  }
}, true);
document.addEventListener('change', (event) => {
  const target = event.target;
  if (target instanceof Element && target.matches('.mobile-section-select select')) {
    scheduleSectionScrollReset();
  }
}, true);

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
