// Stress test: rapid searches, re-search mid-flight, Esc mid-flight, nonsense, "everything".
// After each step checks the lifted count matches the search, and no item is lost, NaN or below the floor.
//   node tools/qa/stress.cjs [url]      (needs puppeteer-core + Chrome)
const puppeteer = require(process.env.PUPPETEER || 'puppeteer-core');
const url = process.argv[2] || 'http://127.0.0.1:5174/';
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const p = await b.newPage(); await p.setViewport({ width: 1600, height: 860 });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 6000));
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const type = async (q, enter = true) => { await p.click('#q', { clickCount: 3 }); await p.keyboard.press('Backspace'); if (q) await p.keyboard.type(q, { delay: 15 }); if (enter) await p.keyboard.press('Enter'); };
  const check = async label => {
    const r = await p.evaluate(q => {
      const n = pieces.length, inWorld = pieces.filter(x => x.body && Matter.Composite.get(engine.world, x.body.id, 'body')).length;
      const spring = flying.filter(x => x.state === 'spring').length, launching = flying.filter(x => x.state === 'launch').length;
      const nan = pieces.filter(x => x.body && !isFinite(x.body.position.x + x.body.position.y)).length;
      const below = pieces.filter(x => x.body && x.state !== 'spring' && x.body.position.y > H + SINK + 40).length;
      let expect = null; if (q && !/^(everything|all|total|year)$/.test(q)) { const { hit } = matchLines(q); expect = hit.reduce((a, l) => a + l.copies.length, 0); }
      return { n, accounted: inWorld + spring, flying: flying.length, spring, launching, expect, nan, below, shown: document.getElementById('num').textContent };
    }, (await p.$eval('#q', e => e.value)).trim().toLowerCase());
    const ok = r.accounted === r.n && !r.nan && !r.below && (r.expect === null || r.flying === r.expect);
    console.log(`${ok ? 'OK  ' : 'FAIL'} ${label.padEnd(34)} ${JSON.stringify(r)}`);
    return ok;
  };
  let pass = true;
  for (const q of ['idli', 'pizza', 'ice cream', 'chai', 'kombucha']) { await type(q); await wait(2600); pass &= await check(`search "${q}"`); }
  await type('idli'); await wait(150); await type('pizza'); await wait(2600); pass &= await check('re-search mid-flight idli→pizza');
  await type('burger'); await wait(250); await p.keyboard.press('Escape'); await wait(3000); pass &= await check('Esc mid-flight');
  await type('qwertyzzz'); await wait(1500); pass &= await check('nonsense word');
  await type('everything'); await wait(4000); pass &= await check('everything');
  for (let i = 0; i < 6; i++) { await type(['idli', 'coke', 'cake'][i % 3]); await wait(120); }
  await wait(3000); pass &= await check('6 searches in under a second');
  await type(''); await wait(2500); pass &= await check('empty Enter (drops back)');
  await p.keyboard.press('Escape'); await wait(7000); pass &= await check('Esc on empty: re-drop pile');
  console.log(errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'); console.log(pass && !errs.length ? 'ALL PASS' : 'SOMETHING FAILED');
  await b.close();
})();
