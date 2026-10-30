#!/usr/bin/env node
'use strict';

/**
 * Builds responsive variants for authored (non-portfolio) media.
 *
 * The portfolio pipeline (optimize-local-images.cjs + build-image-variants.cjs)
 * rewrites `sizes` on every <img> and prunes unreferenced files, so it cannot be
 * used for hand-composed brand, service and interface assets. This script is
 * intentionally narrow: it reads committed master files under assets/media/*
 * and derives a WebP + AVIF ladder plus accurate image-manifest.json entries.
 *
 * Usage: node scripts/build-author-media.cjs [name filter ...]
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const mediaRoot = path.join(root, 'assets', 'media');
const manifestPath = path.join(mediaRoot, 'image-manifest.json');
const ladderWidths = [320, 640, 1024];

/** Master files that own a variant ladder. Aspect ratio is inherited from the master. */
const groups = [
  { dir: 'services', pattern: /^service-[a-z-]+\.webp$/ },
  { dir: 'editorial', pattern: /^bio-[a-z0-9-]+\.webp$/ },
  { dir: 'portrait', pattern: /^portrait-[a-z-]+\.webp$/ },
  { dir: 'interface', pattern: /^(lab|os)-[a-z0-9-]+\.webp$/ },
];

function run(args) {
  execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'fatal', '-y', ...args], { stdio: 'ignore' });
}

function probe(file) {
  const out = execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', file],
  { encoding: 'utf8' }).trim();
  const [width, height] = out.split('x').map(Number);
  if (!width || !height) throw new Error(`Cannot probe ${file}`);
  return { width, height };
}

function encode({ master, source, out, ext, width }) {
  const scale = `scale=${width}:${Math.round((width * master.height) / master.width / 2) * 2}:flags=lanczos`;
  if (ext === 'webp') {
    run(['-i', source, '-vf', scale, '-frames:v', '1', '-c:v', 'libwebp',
      '-quality', width >= master.width ? '82' : '78', '-compression_level', '6', out]);
  } else {
    run(['-i', source, '-vf', scale, '-frames:v', '1', '-c:v', 'libsvtav1', '-crf', '34',
      '-preset', '8', '-pix_fmt', 'yuv420p', '-f', 'avif', out]);
  }
  const size = probe(out);
  return { path: path.relative(root, out).replace(/\\/g, '/'), ...size };
}

function masters() {
  const list = [];
  for (const group of groups) {
    const dir = path.join(mediaRoot, group.dir);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (group.pattern.test(name)) list.push({ dir, name });
    }
  }
  return list;
}

function main() {
  const filters = process.argv.slice(2);
  const manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
  const entries = new Map(manifest.map(entry => [entry.path, entry]));
  let built = 0;

  for (const master of masters()) {
    if (filters.length && !filters.some(filter => master.name.includes(filter))) continue;
    const source = path.join(master.dir, master.name);
    const size = probe(source);
    const stem = master.name.replace(/\.(webp|png)$/, '');
    const dirName = path.basename(master.dir);

    for (const ext of ['webp', 'avif']) {
      for (const width of [...ladderWidths, size.width].filter((w, i, all) => w <= size.width && all.lastIndexOf(w) === i)) {
        const suffix = width === size.width ? '' : `-${width}w`;
        const file = `${stem}${suffix}.${ext}`;
        const out = path.join(master.dir, file);
        const result = out === source
          ? { path: path.relative(root, out).replace(/\\/g, '/'), ...size }
          : encode({ master: size, source, out, ext, width });
        entries.set(result.path, { path: result.path, width: result.width, height: result.height });
        built += 1;
      }
    }
    console.log(`${dirName}/${master.name}: ${size.width}x${size.height}`);
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify([...entries.values()], null, 2)}\n`);
  console.log(`author media: ${built} variants written, manifest holds ${entries.size} entries`);
}

main();
