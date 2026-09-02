import { access, readFile, writeFile } from 'node:fs/promises';

const indexPath = 'dist/index.html';
const stableJs = 'dist/assets/app.js';
const stableCss = 'dist/assets/style.css';

await Promise.all([access(indexPath), access(stableJs), access(stableCss)]);

let html = await readFile(indexPath, 'utf8');
const moduleScript = /<script\s+type="module"[^>]*\bsrc="[^"]+"[^>]*><\/script>/i;
const stylesheet = /<link\s+rel="stylesheet"[^>]*\bhref="[^"]+"[^>]*>/i;
const sourcePagesBootstrap = /<script\s+id="source-pages-bootstrap"[^>]*>[\s\S]*?<\/script>/i;

html = html.replace(sourcePagesBootstrap, '');
html = html.replace(moduleScript, '');
html = html.replace(stylesheet, '');

const bootstrap = `
    <script>
      (function () {
        var base = '/market-revenue-model/';
        var root = document.getElementById('root');
        var stamp = Date.now().toString(36);
        var finished = false;

        function showFailure(code, title, detail) {
          if (!root || finished) return;
          finished = true;
          root.innerHTML = '<div style="min-height:45vh;display:grid;place-items:center;align-content:center;gap:10px;padding:24px;text-align:center;color:#eef6ff;background:#06111d"><strong style="font:600 18px system-ui">' + title + '</strong><span style="max-width:600px;color:#9fb1c1;font:12px/1.6 system-ui">' + detail + '</span><small style="color:#71879a;font:10px system-ui">Error code: ' + code + '</small></div>';
        }

        function shortMessage(value) {
          try {
            var text = value && value.message ? value.message : String(value || 'Unknown error');
            return text.length > 180 ? text.slice(0, 177) + '...' : text;
          } catch (_) {
            return 'Unknown browser error';
          }
        }

        window.addEventListener('error', function (event) {
          if (window.__SI053_BOOT_OK__) return;
          showFailure(
            'SI053-RUNTIME-1',
            'The release bundle started but failed during initialization.',
            shortMessage(event.error || event.message)
          );
        });

        window.addEventListener('unhandledrejection', function (event) {
          if (window.__SI053_BOOT_OK__) return;
          showFailure(
            'SI053-RUNTIME-2',
            'The release bundle started but a module failed during initialization.',
            shortMessage(event.reason)
          );
        });

        var css = document.createElement('link');
        css.rel = 'stylesheet';
        css.href = base + 'assets/style.css?boot=' + stamp;
        document.head.appendChild(css);

        var timeout = window.setTimeout(function () {
          if (!window.__SI053_BOOT_OK__) {
            showFailure(
              'SI053-MOUNT-1',
              'The model loaded but did not mount.',
              'The application file was requested but the interface did not initialize within 15 seconds.'
            );
          }
        }, 15000);

        var app = document.createElement('script');
        app.type = 'module';
        app.src = base + 'assets/app.js?boot=' + stamp;
        app.onload = function () {
          if (window.__SI053_BOOT_OK__) {
            finished = true;
            window.clearTimeout(timeout);
          }
        };
        app.onerror = function () {
          window.clearTimeout(timeout);
          showFailure(
            'SI053-ASSET-3',
            'The application bundle could not be executed.',
            'The browser could not load or evaluate a fresh copy of assets/app.js.'
          );
        };
        document.head.appendChild(app);
      })();
    </script>`;

if (!html.includes('</body>')) {
  throw new Error('Could not find </body> in dist/index.html.');
}

html = html.replace('</body>', `${bootstrap}\n  </body>`);
await writeFile(indexPath, html, 'utf8');

console.log('Pages bootstrap hardened: classic launcher requests cache-busted app.js/style.css and reports runtime failures.');
