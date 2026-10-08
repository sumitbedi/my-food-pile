// What does each search actually match? Lists item names per query so wrong matches are easy to spot.
//   node tools/qa/matches.cjs [url] [comma,separated,queries]
// Needs the app running (python3 -m http.server 5173) and puppeteer-core (npm i -D puppeteer-core).
const puppeteer = require(process.env.PUPPETEER || 'puppeteer-core');
const url = process.argv[2] || 'http://127.0.0.1:5173/';
const Q = (process.argv[3] || 'idli,vada,dosa,egg,pizza,burger,fries,chicken,paneer,cheese,cake,pastry,ice cream,chocolate,coffee,tea,chai,coke,lassi,milk,chips,sandwich,salad,biryani,rasmalai,sweets,veg,rice').split(',');
(async () => {
  const b = await puppeteer.launch({ executablePath: process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new' });
  const p = await b.newPage(); await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 1500));
  console.log(await p.evaluate(Q => Q.map(q => {
    const { hit, byPlace } = matchLines(q), names = {};
    hit.forEach(l => names[l.name] = (names[l.name] || 0) + l.qty);
    return `\n## ${q} → ${hit.reduce((a, l) => a + l.qty, 0)}${byPlace ? ' (by restaurant)' : ''}\n` + Object.entries(names).sort((a, b) => b[1] - a[1]).map(([n, c]) => `  ${c}× ${n}`).join('\n');
  }).join('\n'), Q));
  await b.close();
})();
