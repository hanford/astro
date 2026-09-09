---
'astro': patch
---

Fixes the `<ClientRouter />` leaving the page in a broken state when external code calls `history.pushState()` with null state. The router now falls back to a page reload when it detects a cross-page URL mismatch during back/forward navigation through a stateless history entry.
