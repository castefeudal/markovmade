const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '..');
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.webp':'image/webp','.avif':'image/avif','.woff2':'font/woff2','.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml'};
const server = http.createServer((req,res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(root, '.' + pathname);
  if (!file.startsWith(root + path.sep) && file !== path.join(root,'index.html')) { res.writeHead(403).end(); return; }
  fs.readFile(file, (error,data) => { if(error){res.writeHead(404).end();return;} const headers={'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'};if(/text\/|javascript/.test(headers['content-type'])&&req.headers['accept-encoding']?.includes('gzip')){data=zlib.gzipSync(data);headers['content-encoding']='gzip';headers.vary='accept-encoding';}res.writeHead(200,headers);res.end(data); });
});
server.listen(Number(process.env.PORT||4173),'127.0.0.1',()=>console.log(`Static QA server ready on ${server.address().port}`));
