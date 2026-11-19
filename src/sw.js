/* Generated from src/sw.js. Rebuild with npm run build. */
const CACHE = 'markovmade:' + self.registration.scope + ':__VERSION__';
const FILES = __FILES__;
const urls = new Set(FILES.map(file => new URL(file, self.registration.scope).href));
const shell = new URL('index.html', self.registration.scope).href;
const scope = new URL(self.registration.scope);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    try {
      await cache.addAll([...urls].map(url => new Request(url, { cache: 'reload', redirect: 'error' })));
    } catch (error) {
      await caches.delete(CACHE);
      throw error;
    }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const prefix = 'markovmade:' + self.registration.scope + ':';
    await Promise.all((await caches.keys()).filter(name => name.startsWith(prefix) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== scope.origin || !url.pathname.startsWith(scope.pathname)) return;
  url.search = '';
  const key = event.request.mode === 'navigate' && (url.pathname === scope.pathname || url.href === shell) ? shell : url.href;
  if (!urls.has(key)) return;
  event.respondWith((async () => {
    const cached = await (await caches.open(CACHE)).match(key);
    if (!cached) return fetch(event.request);
    const range = event.request.headers.get('Range');
    if (!range) return cached;
    const bytes = await cached.arrayBuffer();
    const match = /^bytes=(\d*)-(\d*)$/.exec(range);
    const start = match?.[1] ? Number(match[1]) : Math.max(0, bytes.byteLength - Number(match?.[2]));
    const end = match?.[1] && match[2] ? Math.min(Number(match[2]), bytes.byteLength - 1) : bytes.byteLength - 1;
    if (!match || (!match[1] && !match[2]) || !(start <= end)) return new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */' + bytes.byteLength } });
    return new Response(bytes.slice(start, end + 1), { status: 206, headers: {
      'Content-Type': cached.headers.get('Content-Type') || 'application/octet-stream',
      'Content-Range': 'bytes ' + start + '-' + end + '/' + bytes.byteLength,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes'
    } });
  })());
});
