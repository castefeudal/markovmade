#!/usr/bin/env node
'use strict';

/**
 * Regenerates tests/authored-copy.json for the components and dictionaries that
 * were intentionally re-authored. Protected copy is a guard against accidental
 * edits, so this tool is explicit about what it reseals and prints the delta.
 *
 * Usage: node scripts/seal-authored-copy.cjs [component.html ...]
 *        node scripts/seal-authored-copy.cjs --translations
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '..');
const sealPath = path.join(root, 'tests', 'authored-copy.json');
const hash = text => crypto.createHash('sha256').update(text).digest('hex');

async function main() {
  const args = process.argv.slice(2);
  const translationsOnly = args.includes('--translations');
  const targets = args.filter(arg => arg.endsWith('.html'));
  const seal = JSON.parse(fs.readFileSync(sealPath, 'utf8'));
  const browser = await chromium.launch();
  const changes = [];

  try {
    const page = await browser.newPage();
    if (!translationsOnly) {
      const files = targets.length ? targets : Object.keys(seal.components);
      for (const file of files) {
        const html = fs.readFileSync(path.join(root, 'src/components', file), 'utf8');
        const texts = await page.evaluate(fragment => {
          const template = document.createElement('template');
          template.innerHTML = fragment;
          const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
          const out = [];
          let node;
          while ((node = walker.nextNode())) {
            if (node.parentElement?.closest('script,style')) continue;
            const value = node.nodeValue.replace(/\s+/g, ' ').trim();
            if (value) out.push(value);
          }
          return out;
        }, html);
        const next = {};
        for (const value of texts) {
          const key = hash(value);
          next[key] = (next[key] || 0) + 1;
        }
        const previous = seal.components[file] || {};
        const removed = Object.keys(previous).filter(key => !(key in next));
        const added = Object.keys(next).filter(key => !(key in previous));
        if (removed.length || added.length) {
          changes.push(`${file}: +${added.length} new, -${removed.length} protected nodes dropped`);
        }
        seal.components[file] = next;
      }
    }
    for (const file of Object.keys(seal.translations)) {
      seal.translations[file] = hash(fs.readFileSync(path.join(root, file), 'utf8'));
    }
    const { revision, ...body } = seal;
    seal.revision = hash(JSON.stringify(body));
    fs.writeFileSync(sealPath, JSON.stringify(seal));
    console.log(changes.length ? changes.join('\n') : 'seal unchanged (no node delta)');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
