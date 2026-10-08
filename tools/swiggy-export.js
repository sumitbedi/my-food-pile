// my-food-pile — export your Swiggy food orders (read-only).
//
// How to use (no Claude needed):
//   1. Open https://www.swiggy.com in Chrome and log in.
//   2. Open DevTools → Console (Cmd+Option+J on Mac, Ctrl+Shift+J on Windows).
//   3. Paste this whole file and press Enter. Chrome may ask you to type "allow pasting" first.
//   4. Wait ~30 seconds. A file called orders.json downloads. Move it into the repo's data/ folder.
//
// What it does: reads the same order list swiggy.com shows on its "Orders" page, 5 orders at a time,
// for as far back as Swiggy keeps it on the web (about 12 months). It only reads. It does not
// place, change or cancel anything, and it sends your data nowhere — the file stays on your computer.
//
// Instamart orders are not on swiggy.com's web order list; see README.md for adding them from email.

(async () => {
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const all = [];
  let id = '', pages = 0;
  console.log('[my-food-pile] reading your Swiggy orders…');
  while (pages < 400) {
    const res = await fetch('/dapi/order/all?order_id=' + id, { credentials: 'include' });
    const j = await res.json();
    if (j.statusCode !== 0) { console.error('[my-food-pile] Swiggy said:', j.statusMessage, '— are you logged in on swiggy.com?'); return; }
    const page = (j.data && j.data.orders) || [];
    if (!page.length) break;
    all.push(...page);
    id = page[page.length - 1].order_id;
    pages++;
    if (pages % 5 === 0) console.log(`[my-food-pile] ${all.length} orders so far…`);
    await sleep(400);                                         // be gentle with Swiggy's servers
  }

  const clean = s => String(s || '').replace(/[|;~]/g, ' ').replace(/\s+/g, ' ').trim();   // keep the one-line format safe
  const orders = all
    .filter(o => !/cancel/i.test(o.order_status || ''))
    .map(o => ({
      source: 'food',
      ts: String(o.order_time).slice(0, 16),                  // "2026-09-27 13:28"
      place: clean(o.restaurant_name),
      total: Number(o.order_total) || 0,                      // what you actually paid
      items: (o.order_items || []).map(i => ({ name: clean(i.name), qty: Number(i.quantity) || 1, price: Number(i.total) || 0 })),
    }));

  const out = { source: 'swiggy.com order history', exported: new Date().toISOString(), orders };
  window.__pile = out;
  // compact one-line-per-order form, for Claude to read in small batches (see CLAUDE.md)
  window.__pileLines = orders.map(o => `${o.ts}|${o.place}|${o.total}|` + o.items.map(i => `${i.name}~${i.qty}~${i.price}`).join(';'));

  const paid = orders.reduce((a, o) => a + o.total, 0);
  console.log(`[my-food-pile] done: ${orders.length} orders, ₹${Math.round(paid).toLocaleString('en-IN')} paid, ${orders.at(-1)?.ts} → ${orders[0]?.ts}`);

  if (!window.__pileNoDownload) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
    a.download = 'orders.json';
    a.click();
  }
  return `${orders.length} orders`;
})();
