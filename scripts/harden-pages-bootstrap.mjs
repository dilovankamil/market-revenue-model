import { access, readFile, writeFile } from 'node:fs/promises';

const indexPath = 'dist/index.html';
const stableJs = 'dist/assets/app.js';
const stableCss = 'dist/assets/style.css';

await Promise.all([access(indexPath), access(stableJs), access(stableCss)]);

let html = await readFile(indexPath, 'utf8');
const moduleScript = /<script\s+type="module"[^>]*\bsrc="[^"]+"[^>]*><\/script>/i;
const stylesheet = /<link\s+rel="stylesheet"[^>]*\bhref="[^"]+"[^>]*>/i;

if (!moduleScript.test(html)) {
  throw new Error('Could not find the Vite entry script in dist/index.html.');
}

html = html.replace(moduleScript, '');
html = html.replace(stylesheet, '');

const bootstrap = `
    <script type="module">
      (() => {
        const base = '/market-revenue-model/';
        const root = document.getElementById('root');
        const stamp = Date.now().toString(36);

        const showFailure = (code, title, detail) => {
          if (!root) return;
          root.innerHTML = '<div style="min-height:45vh;display:grid;place-items:center;align-content:center;gap:10px;padding:24px;text-align:center;color:#eef6ff;background:#06111d"><strong style="font:600 18px system-ui">' + title + '</strong><span style="max-width:600px;color:#9fb1c1;font:12px/1.6 system-ui">' + detail + '</span><small style="color:#71879a;font:10px system-ui">Error code: ' + code + '</small></div>';
        };

        const css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = base + 'assets/style.css?boot=' + stamp;
        document.head.appendChild(css);

        const timeout = window.setTimeout(() => {
          if (!window.__SI053_BOOT_OK__) {
            showFailure(
              'SI053-MOUNT-1',
              'The model loaded but did not mount.',
              'The release bundle was retrieved, but the interface did not initialize. Reload once; if this remains, report this exact error code.'
            );
          }
        }, 15000);

        import(base + 'assets/app.js?boot=' + stamp)
          .then(() => {
            if (window.__SI053_BOOT_OK__) window.clearTimeout(timeout);
          })
          .catch((error) => {
            window.clearTimeout(timeout);
            console.error('SI-053 release bundle failed to load', error);
            showFailure(
              'SI053-ASSET-2',
              'The application bundle could not be loaded.',
              'A fresh copy of the release bundle could not be executed. This is an asset-loading failure rather than a model calculation error.'
            );
          });
      })();
    </script>`;

if (!html.includes('</body>')) {
  throw new Error('Could not find </body> in dist/index.html.');
}

html = html.replace('</body>', `${bootstrap}\n  </body>`);
await writeFile(indexPath, html, 'utf8');

console.log('Pages bootstrap hardened: stable app.js/style.css are loaded with per-page cache busting.');
