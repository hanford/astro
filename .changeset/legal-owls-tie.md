---
'astro': patch
'@astrojs/cloudflare': patch
---

Fixes dev server crashes on Cloudflare (workerd) caused by late-discovered dependencies triggering mid-request re-optimization. Renderer server entrypoints (e.g. `@astrojs/svelte/server.js`) are now pre-included in `optimizeDeps` for server environments, and `astro/logger/console` is added to the Cloudflare adapter's include list.
