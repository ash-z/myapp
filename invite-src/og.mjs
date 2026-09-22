// Render the link-preview image (docs/og.jpg source) from the opening screen.
// Usage: node og.mjs <path-to-built-index.html> <out.png>
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
const [src, out] = process.argv.slice(2);
const b = await chromium.launch({ args:['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport:{width:1200,height:630}, ignoreHTTPSErrors:true });
const p = await ctx.newPage();
let ok = false;
for (let attempt = 1; attempt <= 4 && !ok; attempt++){
  await p.goto('file://' + src, { waitUntil:'networkidle' });
  ok = await p.evaluate(async()=>{
    try{
      await Promise.all([document.fonts.load('60px Italiana'), document.fonts.load('20px Marcellus'),
                         document.fonts.load('20px "Noto Sans Telugu"', 'శుభలేఖ')]);
      await document.fonts.ready;
    }catch(e){}
    const loaded = fam => [...document.fonts].some(f => f.family.replace(/"/g,'') === fam && f.status === 'loaded');
    return loaded('Italiana') && loaded('Marcellus') && loaded('Noto Sans Telugu');
  });
  console.log('attempt', attempt, 'fonts loaded:', ok);
}
if (!ok) { console.error('Fonts never loaded; refusing to write a fallback-font preview.'); process.exit(1); }
await p.addStyleTag({ content:'.open-btn,.pal{display:none!important}' });
await p.waitForTimeout(2400);
await p.screenshot({ path: out });
await b.close();
