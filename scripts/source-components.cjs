/* Build-time components share the static document's scope; no client templating. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function expand(source, base, stack = []) {
  return source.replace(/<!-- include: ([\w./-]+) -->|\/\* include: ([\w./-]+) \*\//g, (_, html, js) => {
    const file = path.resolve(base, html || js);
    if (!file.startsWith(root + path.sep) || stack.includes(file)) throw new Error('Invalid component include: ' + file);
    return expand(fs.readFileSync(file, 'utf8'), path.dirname(file), [...stack, file]);
  });
}
function documentSource() { return expand(fs.readFileSync(path.join(root, 'src/index.html'), 'utf8'), path.join(root, 'src')); }
function scriptSource(name) { return expand(fs.readFileSync(path.join(root, 'assets/js', name), 'utf8'), path.join(root, 'assets/js')); }
module.exports = {documentSource, scriptSource};
