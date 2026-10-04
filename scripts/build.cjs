/* Reproducible static output. Component sources remain readable; Pages serves
   minified assets plus shell-only critical CSS, not a runtime override layer. */
const fs = require('node:fs');
const path = require('node:path');
const postcss = require('postcss');
const { transform } = require('lightningcss');
const esbuild = require('esbuild');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const productCopy=JSON.parse(fs.readFileSync(path.join(root,'src/locales/product.en.json'),'utf8'));
const translationSource=fs.readFileSync(path.join(root,'assets/js/i18n.js'),'utf8').replace('var META =',`Object.assign(DICT,${JSON.stringify(productCopy)}); var META =`);
const cssFiles = ['fonts','foundation','editorial','lab','personal-os','tokens','product','worlds','clarity','hero','controls','header'];
const out = path.join(root,'assets/dist');
fs.mkdirSync(out,{recursive:true});
const minCss = source => transform({ filename:'site.css', code:Buffer.from(source), minify:true }).code.toString();
function extractComponent(html, className, name) {
  const marker = new RegExp('<div\\b[^>]*class="[^"\\n]*\\b'+className+'\\b[^"\\n]*"[^>]*>');
  const match = marker.exec(html);
  if (!match) throw new Error(`Missing ${className}`);
  const start=match.index, innerStart=start+match[0].length;
  const tags=/<div\b[^>]*>|<\/div\s*>/g;
  tags.lastIndex=innerStart;
  let depth=1, token;
  while ((token=tags.exec(html))) {
    depth+=token[0].startsWith('</') ? -1 : 1;
    if (!depth) break;
  }
  if (depth) throw new Error(`Unbalanced ${className}`);
  fs.writeFileSync(path.join(out,name+'.html'),html.slice(innerStart,token.index));
  const placeholder=match[0].replace(/>$/,` data-component="${name}" aria-busy="true">`)+`<p class="mm-component-loading" role="status">${name==='lab'?'Инструменты загружаются при открытии раздела.':'Прототип загружается при открытии раздела.'}</p></div>`;
  return html.slice(0,start)+placeholder+html.slice(tags.lastIndex);
}
(async () => {
  const template = fs.readFileSync(path.join(root,'src/index.html'),'utf8');
  const css = cssFiles.map(name => fs.readFileSync(path.join(root,'assets/css',name+'.css'),'utf8')).join('\n');
  const tree = postcss.parse(css), selectors = [];
  tree.walkRules(rule => { if (rule.parent.type==='atrule' && /keyframes/.test(rule.parent.name)) return; selectors.push(rule.selector); });
  const browser = await chromium.launch({headless:true});
  let matches, criticalCopy, criticalMeta;
  try {
    const page = await browser.newPage();
    await page.setContent(template.replace(/<script\b[\s\S]*?<\/script>/g,'').replace(/<link\b[^>]*>/g,''));
    await page.addScriptTag({content:fs.readFileSync(path.join(root,'assets/js/storage.js'),'utf8')});
    await page.addScriptTag({content:translationSource.replace('var currentLang =','window.__buildDictionary = DICT; window.__buildMeta = META; var currentLang =')});
    criticalMeta=await page.evaluate(()=>window.__buildMeta.en);
    criticalCopy=await page.evaluate(()=>{
      const copy={},walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      let node;while(node=walker.nextNode()) {
        if(!node.parentElement.closest('#hero,#main-header,#mobile-menu'))continue;
        const text=node.nodeValue.replace(/\s+/g,' ').trim();
        if(window.__buildDictionary[text])copy[text]=window.__buildDictionary[text];
      }
      return copy;
    });
    matches = await page.evaluate(selectors => {
      const used=new Set();
      for(const theme of ['aurum-noir','event-horizon','clarity']) for(const lang of ['ru','en']) {
        document.documentElement.lang=lang;
        document.documentElement.dataset.theme=theme;
        document.body.className=theme==='clarity'?'theme-light theme-clarity':theme==='event-horizon'?'theme-cosmos':'';
        for(const selector of selectors) {
      const neutral = selector.replace(/::[\w-]+(?:\([^)]*\))?/g,'').replace(/:(hover|active|focus-visible|focus-within|focus|visited|disabled|enabled)(?![\w-])/g,'');
          try { if([...document.querySelectorAll(neutral)].some(el => el===document.documentElement || el===document.body || el.closest('#hero,#main-header,#mobile-menu'))) used.add(selector); }
          catch { /* Unsupported selectors remain in the full sheet. */ }
        }
      }
      return [...used];
    }, selectors);
  } finally { await browser.close(); }
  const used=new Set(matches);
  const critical=tree.clone();
  critical.walkRules(rule => {
    if (!used.has(rule.selector) && !/content-visibility|contain-intrinsic-size/.test(rule.toString()) && !/#hero\b|\.mm-hero\b|main-header|mobile-menu|menu-open|theme-switch|lang-switch|burger-btn|mm-theme-|theme-preview|mm-quick|mm-scroll-progress|:root/.test(rule.selector)) rule.remove();
  });
  // Below-fold keyframes are not needed to paint the shell.
  critical.walkAtRules(rule => { if (/keyframes/.test(rule.name) || (rule.nodes && !rule.nodes.length)) rule.remove(); });
  // The shell uses Cormorant RU or the English Latin faces. Legacy section
  // typography must not fetch Cyrillic Garamond while EN copy is still parsed.
  // Those faces remain available in the intent-loaded full stylesheet.
  critical.walkAtRules('font-face', rule => {
    if (/cormorant-(?:normal|italic)-cyrillic\.woff2/.test(rule.toString())) rule.remove();
  });
  critical.walkComments(c=>c.remove());
  const criticalCss=minCss(critical.toString().replace(/\.\.\/media\//g,'assets/media/'));
  const fullCss=minCss(css);
  fs.writeFileSync(path.join(out,'site.css'),fullCss);
  for(const name of fs.readdirSync(path.join(root,'assets/js')).filter(f=>f.endsWith('.js'))) {
    let source=fs.readFileSync(path.join(root,'assets/js',name),'utf8');
    if(name==='i18n.js')source=translationSource;
    source=source.replace(/assets\/js\//g,'assets/dist/');
    const result=await esbuild.transform(source,{minify:true,target:['es2020'],charset:'utf8',legalComments:'none'});
    fs.writeFileSync(path.join(out,name),result.code);
  }
  let html=extractComponent(template,'mm-lab-shell','lab');
  html=extractComponent(html,'mm-os-product','personal-os');
  html=html.replace(/\s*<link rel="stylesheet" href="assets\/css\/[^\"]+">/g,'');
  html=html.replace('</head>',`<style id="critical-css">${criticalCss}</style>\n<noscript><link rel="stylesheet" href="assets/dist/site.css"></noscript>\n</head>`);
  html=html.replace(/src="assets\/js\//g,'src="assets/dist/');
  html=html.replace('<!-- critical-language-copy -->',`<script>window.mmCriticalCopy=${JSON.stringify(criticalCopy).replace(/</g,'\\u003c')};window.mmCriticalMeta=${JSON.stringify(criticalMeta)};</script>`);
  const bootstrap=['storage.js','language-loader.js'].map(name=>fs.readFileSync(path.join(out,name),'utf8')).join('\n');
  html=html.replace('<!-- critical-runtime -->',`<script>${bootstrap}</script>`);
  html=html.replace(/\n[ \t]+/g,'\n').replace(/\n\s*\n\s*\n/g,'\n\n');
  fs.writeFileSync(path.join(root,'index.html'),html);
  const expected=new Set(['site.css','lab.html','personal-os.html',...fs.readdirSync(path.join(root,'assets/js')).filter(name=>name.endsWith('.js'))]);
  for(const name of fs.readdirSync(out))if(!expected.has(name)&&/\.(css|js|html)$/.test(name))fs.unlinkSync(path.join(out,name));
  console.log(`Built: critical CSS ${Buffer.byteLength(criticalCss)} B; full CSS ${Buffer.byteLength(fullCss)} B; HTML ${Buffer.byteLength(html)} B.`);
})().catch(error=>{console.error(error);process.exitCode=1;});
