// my-food-pile — combine whatever raw exports you have into data/orders.json
//   node tools/build-orders.mjs
//
// Reads any of these (all optional, all git-ignored):
//   data/raw/food-lines.txt   one order per line: "2026-09-27 13:28|Subway|390|Aloo Patty Sandwich~1~229;Coffee~1~120"
//                             (what Claude collects from swiggy.com, see CLAUDE.md)
//   data/raw/food.json        the file tools/swiggy-export.js downloads (rename orders.json → food.json)
//   data/raw/instamart.json   { "orders": [ { "ts", "items": [{name, qty, price}], "total" } ] } from Instamart emails
//   data/raw/statements.json  { "orders": [ { "ts", "place", "total", "source" } ] } from the Swiggy app's Account Statement PDFs
// Writes data/orders.json (newest first), de-duplicated, and prints a short summary to sanity-check.

import fs from 'node:fs';

const raw = p => (fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null);
const orders = [];

const lines = raw('data/raw/food-lines.txt');
if (lines) for (const l of lines.split('\n').map(s => s.trim()).filter(Boolean)) {
  const [ts, place, total, its = ''] = l.split('|');
  orders.push({
    source: 'food', ts: ts.slice(0, 16), place: place.trim(), total: +total || 0,
    items: its.split(';').filter(Boolean).map(x => { const p = x.split('~'), price = p.pop(), qty = p.pop(); return { name: p.join('~').replace(/\s+/g, ' ').trim(), qty: +qty || 1, price: +price || 0 }; }),
  });
}

const food = raw('data/raw/food.json');
if (food) for (const o of JSON.parse(food).orders) orders.push({ ...o, source: 'food' });

const stm = raw('data/raw/statements.json');            // phone-app statements: one line per order, no dishes
if (stm) for (const o of JSON.parse(stm).orders) orders.push({ source: o.source || 'food', place: o.place, ts: String(o.ts).slice(0, 16), total: +o.total || 0, items: o.items?.length ? o.items : [{ name: o.place, qty: 1, price: +o.total || 0 }] });

const im = raw('data/raw/instamart.json');
if (im) for (const o of JSON.parse(im).orders) orders.push({ source: 'instamart', place: 'Instamart', ts: String(o.ts).replace('T', ' ').slice(0, 16), total: +o.total || 0, items: o.items });

// same time + place + total = same order (e.g. both a download and Claude's lines were used)
const seen = new Set(), out = [];
for (const o of orders.sort((a, b) => b.ts.localeCompare(a.ts))) {
  const k = `${o.ts}|${o.place}|${o.total}`;
  if (!seen.has(k)) { seen.add(k); out.push(o); }
}
if (!out.length) { console.error('No raw data found in data/raw/. See README.md.'); process.exit(1); }

fs.writeFileSync('data/orders.json', JSON.stringify({ built: new Date().toISOString(), orders: out }, null, 1));
const by = s => out.filter(o => o.source === s), sum = a => Math.round(a.reduce((t, o) => t + o.total, 0)).toLocaleString('en-IN');
const items = out.reduce((t, o) => t + o.items.reduce((u, i) => u + (i.qty || 1), 0), 0);
console.log(`data/orders.json: ${out.length} orders (${by('food').length} food ₹${sum(by('food'))}, ${by('instamart').length} Instamart ₹${sum(by('instamart'))}), ${items} items, ${out.at(-1).ts} → ${out[0].ts}`);
