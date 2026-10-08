// my-food-pile — a year of your food-delivery orders as a physics pile. Type a food, watch it fly up.
// Data: data/orders.json (yours, git-ignored) or data/sample.json (fake, ships with the repo). See README.md.
const { Engine, Bodies, Body, Composite, Sleeping, Query } = Matter;

// ---------- categories: which sprite a line item becomes ----------
// [name, regex on item name, shape: ['c', diameter] or ['r', w, h] (in units of S), placeholder]
const CATS = [
  ['idli',           /\bidl[iy]\b|\bidli\b/i,                         ['c', .82],      { draw: 'idli' }],
  ['vada',           /\bvada\b|\bwada\b|\bvadai\b|\bbonda\b/i,         ['c', .86],      { draw: 'vada' }],
  ['dosa',           /\bdosa\b|\bdose\b|pesarattu|uttapam/i,           ['r', 1.45, .5], { e: '🌯', col: '#d9a441' }],
  ['poori',          /\bpoori\b|\bpuri\b|porotta|parotta|paratha|\broti\b|\bnaan\b|\bkulcha\b|appam|chapati|bhatura/i, ['c', .9], { e: '🫓', col: '#d8a756' }],
  ['pizza',          /\bpizzas?\b(?! party| mcpuff)|cheese burst|cheese volcano|forest floor|golden corn|margherita/i,                                  ['r', 1, .85],   { e: '🍕', col: '#e2a23b' }],
  ['garlic-bread',   /garlic bread|\bbread\b/i,                        ['r', 1.05, .55],{ e: '🥖', col: '#d39a4a' }],
  ['rasmalai',       /rasmalai|rasgulla|rosogolla|champakali|chenapais|malai gulla|malai sandwich|halwa|laddu|cream roll|gulab/i, ['r', .95, .55], { e: '🍮', col: '#efe1b8' }],
  ['ice-cream-cone', /\bcone\b|tricone/i,                              ['r', .58, 1.15],{ e: '🍦', col: '#c58b52' }],
  ['ice-cream-cup',  /ice cream|willy wonka|nutty brew|coconut dew|alphonso mango/i,  ['r', .8, .8],   { e: '🍨', col: '#f2b3c6' }],
  ['kombucha',       /kombucha/i,                                      ['r', .42, 1.25],{ e: '🍾', col: '#f0a63a' }],
  ['lassi',          /\blassi\b|\bmilk\b|\byogurt\b|\bjuice\b|beyond water|raw pressery|\bshake\b/i, ['r', .5, .95], { e: '🧃', col: '#f1efe8' }],
  ['chai',           /\bchai\b|(?<!iced )\btea\b|\bcoffee\b(?! chocolate)|\blatte\b/i,                 ['r', .6, .72],  { e: '☕', col: '#c99a6b' }],
  ['burger',         /\bburgers?\b(?! pizza)|whopper|mcaloo|mccheese/i,                ['r', 1, .82],   { e: '🍔', col: '#d68a3a' }],
  ['fries',          /\bfries\b/i,                                     ['r', .78, .98], { e: '🍟', col: '#e0453a' }],
  ['fried-chicken',  /zinger|wings|popcorn chicken|bowl meal|box meal|kebab|fried chicken|drumstick/i, ['r', 1, .68], { e: '🍗', col: '#c97a32' }],
  ['shawarma',       /shawarma|\bwrap\b|taco|kathi|\broll\b(?!.*cream)/i, ['r', .5, 1.15],{ e: '🥙', col: '#e8dcc4' }],
  ['biryani',        /biryani|ghee rice|rice bowl|fried rice|khichdi|haleem|rajma|chole|rice box|noodles|chow mein|pasta|mac & cheese|curry|\bdal\b|stroganoff|\bsalad\b|\bmeal\b|joy box|fry\b/i, ['r', 1.05, .68], { e: '🍛', col: '#e0a13c' }],
  ['sandwich',       /(?<!malai )\bsandwich\b(?! bread)|\bb\.?m\.?t\b|\bpita\b|\bomelette\b/i,              ['r', 1, .72],   { e: '🥪', col: '#e6c37a' }],
  ['cake',           /\bcakes?\b|cheesecake|\bbrownies?\b|\bpastry\b|tiramisu|\bdonut\b|\bhamper\b|\btruffle\b/i, ['r', .9, .72], { e: '🍰', col: '#7a4a2f' }],
  ['tart',           /\btart\b|cookie|biscuit/i,                       ['r', .82, .45], { e: '🥧', col: '#5a3522' }],
  ['chips',          /\bchips\b|\blay'?s\b|\bmixture\b|\bcashews?\b(?!.*(dosa|biscuit))|jhaal muri/i,       ['r', .78, 1],   { e: '🥔', col: '#f2c230' }],
  ['puffs',          /\bpuffs?\b/i,                          ['r', .78, 1],   { e: '🍿', col: '#7a5cf0' }],
  ['coke',           /\bcoke\b|coca|thums ?up|sprite|pepsi|\bcan\b/i,  ['r', .48, .82], { e: '🥤', col: '#d8252b' }],
  ['banana',         /banana/i,                                        ['r', 1.05, .48],{ e: '🍌', col: '#f3d23a' }],
  ['fan',            /\bfan\b/i,                                       ['r', 1.4, 1.6], { e: '🌀', col: '#e9e9e6' }],
  ['tt-racquet',     /racquet|racket/i,                                ['r', .9, 1.35], { e: '🏓', col: '#d73a3a' }],
  ['instax-film',    /instax|film/i,                                   ['r', .8, .6],   { e: '📷', col: '#d9d9d6' }],
];
const FALLBACK = ['takeaway', null, ['r', .9, .78], { e: '🥡', col: '#b98552' }];
const CAT = Object.fromEntries([...CATS, FALLBACK].map(c => [c[0], { name: c[0], re: c[1], shape: c[2], ph: c[3] }]));

// search words that should match more than their literal spelling
const SYN = {
  egg: /\beggs?\b|\bomelette\b|\banda\b/i, paneer: /\bpaneer\b/i, mutton: /\bmutton\b|\bgosht\b/i, cheese: /\bchees(e|y)\b|mccheese/i,
  idli: /\bidl[iy]s?\b/i, vada: /\bvada\b|\bwada\b|\bvadai\b/i, dosa: /\bdosa\b|\bdose\b/i,
  'ice cream': /\bice cream\b|\bcone\b|willy wonka|nutty brew|coconut dew|alphonso mango/i, icecream: /\bice cream\b|\bcone\b|willy wonka|nutty brew|coconut dew|alphonso mango/i,
  chips: /\bchips\b|\blay'?s\b/i, coke: /\bcoke\b|coca[ -]?cola/i, 'cold drink': /\bcoke\b|coca|thums ?up|sprite|pepsi/i, 'soft drink': /\bcoke\b|coca|thums ?up|sprite|pepsi/i,
  burger: /\bburgers?\b|\bwhopper\b|\bmcaloo\b|\bmccheese\b/i, chai: /\bchai\b|ginger tea|masala tea/i, tea: /\bteas?\b|\bchai\b/i, coffee: /\bcoffee\b|\blatte\b/i,
  sweets: /rasmalai|rasgulla|rosogolla|champakali|chenapais|malai gulla|halwa|laddu|gulab/i, sweet: /rasmalai|rasgulla|rosogolla|champakali|chenapais|malai gulla|halwa|laddu|gulab/i,
  cake: /\bcakes?\b|\bcheesecake\b/i, pastry: /\bpastr(y|ies)\b/i, chicken: /\bchicken\b|\bzinger\b|\bwings\b/i, puffs: /\bpuffs?\b/i, fries: /\bfries\b/i,
  shawarma: /\bshawarma\b/i, biryani: /\bbiryani\b/i, pizza: /\bpizzas?\b|cheese burst|cheese volcano|forest floor|golden corn|margherita/i, kombucha: /\bkombucha\b/i, lassi: /\blassi\b/i, rasmalai: /\brasmalai\b/i,
};
// a word only means the food when it isn't part of one of these
const NOT = {
  egg: /eggless|egg-less|no egg|without egg/i, cheese: /cheese ?cake/i, cream: /ice cream|cream roll/i,
  pizza: /pizza party|mcpuff/i, burger: /burger pizza/i, sandwich: /malai sandwich|sandwich bread/i, salad: /without salad/i,
  veg: /non[- ]?veg/i, coffee: /oatmeal/i, vada: /\bpa[ao]v\b|\bpao\b/i,
};

// ---------- canvas + layout ----------
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const panel = document.getElementById('panel'), input = document.getElementById('q');
const elResult = document.getElementById('result'), elNum = document.getElementById('num'), elUnit = document.getElementById('unit'),
      elPaid = document.getElementById('paid'), elFacts = document.getElementById('facts');
let W = 0, H = 0, DPR = 1, L = {};
function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const portrait = W / H < 1.15, pad = Math.max(32, W * 0.055);
  if (portrait) {   // 4:5 / 9:16 — panel on top, the block forms underneath it
    const pw = W - pad * 2;
    Object.assign(panel.style, { left: pad + 'px', top: H * 0.05 + 'px', width: pw + 'px' });
    L = { x0: pad, x1: W - pad, y0: H * 0.44, y1: H * 0.64 };
  } else {          // 16:9 — panel on the left, the block forms on the right
    const pw = Math.min(440, W * 0.34);
    Object.assign(panel.style, { left: pad + 'px', top: H * 0.07 + 'px', width: pw + 'px' });
    L = { x0: pad + pw + W * 0.05, x1: W - pad, y0: H * 0.1, y1: H * 0.6 };
  }
}
resize();

// ---------- sprites (real PNGs if present, otherwise placeholders; re-checked while you work) ----------
const sprites = {}, real = new Set();
function placeholder(cat) {
  const c = document.createElement('canvas'), n = 160; c.width = c.height = n;
  const g = c.getContext('2d'), ph = cat.ph;
  g.translate(n / 2, n / 2);
  if (ph.draw === 'idli') {
    const gr = g.createRadialGradient(-18, -22, 6, 0, 0, 74);
    gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#d6cfbf');
    g.fillStyle = gr; g.beginPath(); g.ellipse(0, 6, 74, 58, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(120,110,90,.25)'; g.lineWidth = 3; g.stroke();
  } else if (ph.draw === 'vada') {
    const gr = g.createRadialGradient(-20, -20, 8, 0, 0, 78);
    gr.addColorStop(0, '#e2a04a'); gr.addColorStop(1, '#8a4f1c');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 76, 0, Math.PI * 2); g.arc(0, 0, 20, 0, Math.PI * 2, true); g.fill('evenodd');
  } else {
    g.font = '128px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(ph.e, 0, 8);
  }
  return c;
}
function crop(img) {
  const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width, y0 = c.height, x1 = 0, y1 = 0;
  for (let y = 0; y < c.height; y += 2) for (let x = 0; x < c.width; x += 2) {
    if (d[(y * c.width + x) * 4 + 3] > 12) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 <= x0) return c;
  const o = document.createElement('canvas'); o.width = x1 - x0 + 2; o.height = y1 - y0 + 2;
  o.getContext('2d').drawImage(c, x0, y0, o.width, o.height, 0, 0, o.width, o.height);
  o.hull = outline(d, c.width, x0, y0, o.width, o.height);
  return o;
}
// convex outline of the opaque pixels, ~16 points, so bodies collide like the picture looks
function outline(d, cw, x0, y0, w, h) {
  const pts = [], st = 6;
  for (let y = y0; y < y0 + h; y += st) {
    let l = -1, r = -1;
    for (let x = x0; x < x0 + w; x += 2) if (d[(y * cw + x) * 4 + 3] > 40) { if (l < 0) l = x; r = x; }
    if (l >= 0) pts.push([l, y], [r, y]);
  }
  pts.sort((p, q) => p[0] - q[0] || p[1] - q[1]);
  const cross = (o, p, q) => (p[0] - o[0]) * (q[1] - o[1]) - (p[1] - o[1]) * (q[0] - o[0]);
  const lo = [], up = [];
  for (const p of pts) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  let hull = lo.slice(0, -1).concat(up.slice(0, -1));
  if (hull.length > 16) { const k = hull.length / 16; hull = Array.from({ length: 16 }, (_, i) => hull[Math.floor(i * k)]); }
  return hull.map(([x, y]) => ({ x: (x - x0) / w - .5, y: (y - y0) / h - .5 }));
}
function tryLoad(name) {
  return new Promise(done => {
    const img = new Image();
    img.onload = () => { sprites[name] = crop(img); real.add(name); done(); };
    img.onerror = done;
    img.src = `sprites/${name}.png?v=${Date.now()}`;
  });
}
for (const name in CAT) sprites[name] = placeholder(CAT[name]);
const firstLoad = Promise.all(Object.keys(CAT).map(tryLoad));
setInterval(() => { for (const name in CAT) if (!real.has(name)) tryLoad(name); }, 4000);

// ---------- physics ----------
const engine = Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 8 });
engine.gravity.y = 1.5;
const world = engine.world;
let walls = [], SINK = 0;      // SINK: how far the floor sits below the screen edge, so a big pile stays low
function buildWalls() {
  Composite.remove(world, walls);
  const t = 200, o = { isStatic: true, friction: .8 };
  walls = [
    Bodies.rectangle(W / 2, H + SINK + t / 2, W * 3, t, o),
    Bodies.rectangle(-t / 2, H - H * 2, t, H * 6, o),
    Bodies.rectangle(W + t / 2, H - H * 2, t, H * 6, o),
  ];
  Composite.add(world, walls);
}
buildWalls();

// ---------- data -> pieces ----------
let S = 40;                 // base size of one piece, in px
const pieces = [], lines = [];
let allOrders = 0, allPaid = 0;
const SOLID = { group: 0, category: 1, mask: 0xffffffff };
const GHOST = { group: 0, category: 1, mask: 0 };

function catsFor(name) {
  let hit = CATS.filter(c => c[1].test(name)).map(c => c[0]);
  if (hit.includes('ice-cream-cone')) hit = hit.filter(h => h !== 'ice-cream-cup');
  if (hit.some(h => h.startsWith('ice-cream'))) hit = hit.filter(h => h !== 'cake');   // brownie-flavoured ice cream is ice cream
  if (hit.includes('shawarma') && /cream roll/i.test(name)) hit = hit.filter(h => h !== 'shawarma');
  return hit.length ? hit.slice(0, 2) : ['takeaway'];
}
function dims(cat) {
  const sh = CAT[cat].shape, box = sh[0] === 'c' ? [sh[1] * S, sh[1] * S] : [sh[1] * S, sh[2] * S];
  if (!real.has(cat)) return box;
  const img = sprites[cat], ar = img.width / img.height, D = Math.max(...box);
  return ar >= 1 ? [D, D / ar] : [D * ar, D];
}
function makeBody(p, x, y) {
  const sh = CAT[p.cat].shape, opts = { friction: .55, frictionStatic: .9, restitution: .12, density: .002, slop: .03, sleepThreshold: 40 };
  p.off = { x: 0, y: 0 };
  const hull = real.has(p.cat) && sprites[p.cat].hull;
  if (hull && hull.length >= 3) {
    const [w, h] = dims(p.cat), vs = hull.map(v => ({ x: v.x * w * .97, y: v.y * h * .97 }));
    const c = Matter.Vertices.centre(vs);
    const b = Bodies.fromVertices(x, y, [vs], opts);
    p.off = { x: -c.x, y: -c.y };                     // picture centre, in body space
    Body.setAngle(b, Math.random() * Math.PI * 2);
    b.piece = p;
    return b;
  }
  const b = sh[0] === 'c'
    ? Bodies.circle(x, y, sh[1] * S / 2 * .96, opts)
    : Bodies.rectangle(x, y, sh[1] * S * .94, sh[2] * S * .94, { ...opts, chamfer: { radius: Math.min(sh[1], sh[2]) * S * .22 } });
  Body.setAngle(b, Math.random() * Math.PI * 2);
  b.piece = p;
  return b;
}

async function load() {
  let data, sample = false;
  try { const r = await fetch('data/orders.json', { cache: 'no-store' }); if (!r.ok) throw 0; data = await r.json(); }
  catch { data = await (await fetch('data/sample.json')).json(); sample = true; }
  document.getElementById('sample').hidden = !sample;
  const ts = data.orders.map(o => o.ts).sort(), mon = t => new Date(t.replace(' ', 'T')).toLocaleString('en-IN', { month: 'short', year: 'numeric' });
  if (ts.length) document.getElementById('range').textContent = `${mon(ts[0])} – ${mon(ts[ts.length - 1])}`;
  data.orders.forEach((o, oi) => {
    const menu = o.items.reduce((a, it) => a + (it.price || 0), 0) || 1;
    allOrders++; allPaid += o.total || 0;
    for (const it of o.items) {
      // what was actually paid for this line: the order's paid total, shared by menu price
      const line = { name: it.name, qty: it.qty || 1, paid: (o.total || 0) * (it.price || 0) / menu, place: o.place, ts: o.ts, order: oi, copies: [] };
      const cats = catsFor(it.name);
      for (let k = 0; k < line.qty; k++) line.copies.push(cats.map(cat => { const p = { cat, line, state: 'pile' }; pieces.push(p); return p; }));
      lines.push(line);
    }
  });
  await Promise.race([firstLoad, new Promise(r => setTimeout(r, 4000))]);
  const area = pieces.reduce((a, p) => { const [w, h] = dims(p.cat); return a + (w / S) * (h / S); }, 0);
  // item size: the largest that lets the WHOLE pile settle on the visible floor in the bottom ~27% of the screen
  // (calibrated: settled pile height ≈ .82 × total item area / width). ?size=0.8 etc. scales from there.
  const fit = Math.sqrt(H * 0.27 * W / (area * .82));
  S = Math.max(16, Math.min(90, fit * +(new URLSearchParams(location.search).get('size') || 1)));
  SINK = 0;
  buildWalls();
  dropAll();
}

function dropAll() {
  for (const p of pieces) if (p.body) Composite.remove(world, p.body);
  flying = [];
  const order = pieces.slice().sort(() => Math.random() - .5);
  order.forEach((p, i) => {
    const x = S + Math.random() * (W - 2 * S), y = -S - (i / order.length) * H * 2.2 - Math.random() * 40;
    p.body = makeBody(p, x, y); p.state = 'pile';
    Composite.add(world, p.body);
  });
  hideResult();
}

// ---------- search ----------
let flying = [];
function release() {
  for (const p of flying) {
    const b = p.body;
    if (p.state === 'launch') { b.collisionFilter = { ...SOLID }; p.state = 'pile'; continue; }   // still in the world
    p.state = 'pile';
    Body.setPosition(b, { x: p.x, y: p.y }); Body.setAngle(b, p.a);
    Body.setVelocity(b, { x: (Math.random() - .5) * 2, y: -Math.random() * 2 });
    Body.setAngularVelocity(b, (Math.random() - .5) * .15);
    b.collisionFilter = { ...SOLID };
    Sleeping.set(b, false);
    Composite.add(world, b);
  }
  flying = [];
  hideResult();
}

const esc = s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
// whole words only, plural-tolerant: "egg" finds "Egg Dosa" but never "Eggless"
const forms = q => [...new Set([q, q.replace(/(?<=\w{3})s$/, ''), q.replace(/(?<=\w{3})es$/, '')])];
function wordRe(q) {
  const alts = forms(q).map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+'));
  return new RegExp('\\b(?:' + alts.join('|') + ')(?:s|es)?\\b', 'i');
}
function matchLines(q) {
  const key = forms(q).find(f => SYN[f] || NOT[f]) || q;
  const re = SYN[key] || wordRe(q), not = NOT[key];
  let hit = lines.filter(l => re.test(l.name) && !(not && not.test(l.name)));
  if (hit.length) return { hit, byPlace: false };
  const pr = wordRe(q);
  hit = lines.filter(l => pr.test(l.place));
  return { hit, byPlace: hit.length > 0 };
}
function search(raw) {
  const q = raw.trim().toLowerCase();
  release();
  if (!q) return;
  if (/^(everything|all|total|year)$/.test(q)) return everything();

  const { hit, byPlace } = matchLines(q);

  const want = CATS.filter(c => c[1].test(q) || c[0] === q || c[0].replace('-', ' ') === q).map(c => c[0]);
  const chosen = [];
  for (const l of hit) for (const copy of l.copies) chosen.push(copy.find(p => want.includes(p.cat)) || copy[0]);

  if (!chosen.length) { shake(); showResult({ num: '0', unit: q, paid: '₹0', facts: zeroLine(q) }); return; }
  launch(chosen);
  showResult(describe(q, hit, byPlace, chosen.length));
}

// the human bits: real numbers, said plainly
function describe(q, hit, byPlace, count) {
  const paid = hit.reduce((a, l) => a + l.paid, 0);
  const orders = new Set(hit.map(l => l.order)).size;
  const facts = [];
  if (!byPlace) {
    const places = {}; for (const l of hit) places[l.place] = (places[l.place] || 0) + l.qty;
    const [top, n] = Object.entries(places).sort((a, b) => b[1] - a[1])[0];
    if (Object.keys(places).length === 1) facts.push(top === 'Instamart' ? 'All from Instamart.' : `All from ${top}.`);
    else if (n / count >= .4) facts.push(`${Math.round(n / count * 100)}% from ${top}.`);
  }
  const meal = {}; for (const l of hit) { const h = +l.ts.slice(11, 13); const m = h < 11 ? 'before 11 AM' : h < 16 ? 'at lunch' : h < 19 ? 'in the evening' : h < 23 ? 'at dinner' : 'after 11 PM'; meal[m] = (meal[m] || 0) + l.qty; }
  const [mt, mn] = Object.entries(meal).sort((a, b) => b[1] - a[1])[0];
  if (mn / count >= .5 && count > 2) facts.push(`Mostly ${mt}.`);
  if (orders >= 4) facts.push(`One order every ${Math.round(365 / orders)} days.`);
  else facts.push(orders === 1 ? 'Ordered once, all year.' : `Ordered just ${orders} times.`);
  const unit = byPlace ? `things from ${hit[0].place}` : plural(q, count);
  return { num: count.toLocaleString('en-IN'), unit, paid: rupees(paid) + ' paid', facts: facts.join(' '), count };
}
function everything() {
  for (const p of pieces) if (p.body) { Sleeping.set(p.body, false); Body.setVelocity(p.body, { x: (Math.random() - .5) * 4, y: -6 - Math.random() * 10 }); Body.setAngularVelocity(p.body, (Math.random() - .5) * .4); }
  const items = lines.reduce((a, l) => a + l.qty, 0);
  showResult({ num: items.toLocaleString('en-IN'), unit: 'things, delivered', paid: rupees(allPaid) + ' paid', count: items,
               facts: `${allOrders} orders in a year. One every ${(365 / allOrders).toFixed(1)} days.` });
}
const rupees = n => '₹' + Math.round(n).toLocaleString('en-IN');
const plural = (q, n) => n === 1 || /s$|lassi|chai|tea|coffee|fries|chips|puffs|rasmalai|biryani|poha|maggi|bread|ice cream/.test(q) ? q : q + 's';
const zeroLine = q => ['Not once. Respect.', 'Never ordered. Suspicious.', 'Zero. Clean record.'][q.length % 3];

function launch(list) {
  const now = performance.now();
  // a tight block, at most 6 wide, at the pieces' real size; sorted by left-right so paths don't cross
  const n = list.length, gap = S * .06;
  const seen = p => { const [w, h] = dims(p.cat); return real.has(p.cat) ? [w, h] : [Math.max(w, h), Math.max(w, h)]; };   // emoji stand-ins draw square
  const cellW = Math.max(...list.map(p => seen(p)[0])) + gap, cellH = Math.max(...list.map(p => seen(p)[1])) + gap;
  let cols = n <= 3 ? n : Math.min(6, Math.ceil(Math.sqrt(n)));
  while (Math.ceil(n / cols) * cellH > (L.y1 - L.y0) && cols * cellW < (L.x1 - L.x0)) cols++;   // only widen if it won't fit
  const rows = Math.ceil(n / cols), cx = (L.x0 + L.x1) / 2, cy = (L.y0 + L.y1) / 2;
  const slots = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), inRow = r === rows - 1 ? n - r * cols : cols, c = i - r * cols;
    slots.push({ x: cx + (c - (inRow - 1) / 2) * cellW + (Math.random() - .5) * S * .08,
                 y: cy + (r - (rows - 1) / 2) * cellH + (Math.random() - .5) * S * .08 });
  }
  list.sort((a, b) => a.body.position.x - b.body.position.x);
  slots.sort((a, b) => a.x - b.x);
  // keep each piece's own slot but launch the ones closest to their slot first
  list.forEach((p, i) => {
    const s = slots[i]; p.tx = s.x; p.ty = s.y; p.ta = (Math.random() - .5) * .22;   // slight hand-placed tilt
    const b = p.body;
    p.state = 'launch'; p.t0 = now; p.tSpring = now + 240 + Math.random() * 160 + (i / n) * 300;
    Sleeping.set(b, false);
    const dx = s.x - b.position.x;
    Body.setVelocity(b, { x: dx / 70 + (Math.random() - .5) * 3, y: -15 - Math.random() * 8 });
    Body.setAngularVelocity(b, (Math.random() - .5) * .45);
  });
  flying = list;
}

function shake() {
  for (const p of pieces) if (p.state === 'pile' && p.body && Math.random() < .3) {
    Sleeping.set(p.body, false);
    Body.setVelocity(p.body, { x: (Math.random() - .5) * 1.5, y: -Math.random() * 3.5 });
  }
}

// ---------- result text ----------
let countTo = 0, countAt = 0, countText = '';
function showResult(r) {
  elUnit.textContent = r.unit; elPaid.textContent = r.paid; elFacts.textContent = r.facts;
  countTo = r.count || 0; countText = r.num; countAt = performance.now() + 640;
  elNum.textContent = countTo ? '0' : r.num;
  clearTimeout(showResult.t);
  showResult.t = setTimeout(() => elResult.classList.add('show'), 600);
}
function hideResult() { elResult.classList.remove('show'); countTo = 0; }

// ---------- loop ----------
const STEP = 1000 / 120;
let last = performance.now(), acc = 0;
function frame(now) {
  const dt = Math.min(50, now - last); last = now; acc += dt;
  while (acc >= STEP) { Engine.update(engine, STEP); acc -= STEP; }
  const sec = dt / 1000;

  for (const p of flying) {
    const b = p.body;
    if (p.state === 'launch') {
      if (now - p.t0 > 130) b.collisionFilter = GHOST;        // shove neighbours, then pass through
      if (now >= p.tSpring) {                                   // hand over from physics to the spring
        const v = Body.getVelocity(b);                          // per 16.67ms -> px/s
        p.x = b.position.x; p.y = b.position.y; p.a = b.angle;
        p.vx = v.x * 60; p.vy = v.y * 60; p.va = Body.getAngularVelocity(b) * 60;
        Composite.remove(world, b); p.state = 'spring';
      }
    }
    if (p.state === 'spring') {
      const k = 90, c = 12.5;
      p.vx += ((p.tx - p.x) * k - p.vx * c) * sec; p.x += p.vx * sec;
      p.vy += ((p.ty - p.y) * k - p.vy * c) * sec; p.y += p.vy * sec;
      const da = Math.atan2(Math.sin(p.ta - p.a), Math.cos(p.ta - p.a));
      p.va += (da * 110 - p.va * 14) * sec; p.a += p.va * sec;
    }
  }

  if (countTo && now > countAt) {
    const t = Math.min(1, (now - countAt) / 800), e = 1 - Math.pow(1 - t, 4);
    elNum.textContent = t < 1 ? Math.round(countTo * e).toLocaleString('en-IN') : countText;
  }

  hoverTick(sec);
  draw();
  requestAnimationFrame(frame);
}

function drawPiece(p, x, y, a) {
  const img = sprites[p.cat] || sprites.takeaway;
  const [w, h] = dims(p.cat);
  let dw, dh;
  if (real.has(p.cat)) { dw = w; dh = h; }
  else dw = dh = Math.max(w, h);                                  // emoji placeholders are square
  const o = p.off || { x: 0, y: 0 };
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  if (p.hs > 1.001) ctx.scale(p.hs, p.hs);
  ctx.drawImage(img, o.x - dw / 2, o.y - dh / 2, dw, dh);
  ctx.restore();
}

function draw() {
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
  for (const p of pieces) if (p.state !== 'spring' && p.body && p !== hover) drawPiece(p, p.body.position.x, p.body.position.y, p.body.angle);
  if (hover && hover.state !== 'spring' && hover.body) drawLifted(hover, hover.body.position.x, hover.body.position.y, hover.body.angle);
  // lifted pieces get a soft shadow so they read as floating above the page
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.14)'; ctx.shadowBlur = S * .35; ctx.shadowOffsetY = S * .18;
  for (const p of flying) if (p.state === 'spring' && p !== hover) drawPiece(p, p.x, p.y, p.a);
  ctx.restore();
  if (hover && hover.state === 'spring') drawLifted(hover, hover.x, hover.y, hover.a);
}
function drawLifted(p, x, y, a) {
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.2)'; ctx.shadowBlur = S * .5; ctx.shadowOffsetY = S * .25;
  drawPiece(p, x, y, a); ctx.restore();
}

// ---------- hover: what is this piece? ----------
const tip = document.getElementById('tip');
let hover = null, mx = -1, my = -1;
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function when(ts) {
  const d = new Date(ts.replace(' ', 'T') + ':00'), h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
  return `${DAY[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()} · ${h % 12 || 12}:${m} ${h < 12 ? 'AM' : 'PM'}`;
}
function pieceAt(x, y) {
  // lifted pieces first (they're on top), then the pile
  for (let i = flying.length - 1; i >= 0; i--) {
    const p = flying[i]; if (p.state !== 'spring') continue;
    const [w, h] = dims(p.cat), r = Math.max(w, h) * .55;
    if (Math.hypot(x - p.x, y - p.y) < r) return p;
  }
  const bodies = []; for (const p of pieces) if (p.state === 'pile' && p.body) bodies.push(p.body);
  const hit = Query.point(bodies, { x, y });
  return hit.length ? hit[hit.length - 1].piece : null;
}
function setHover(p) {
  if (p === hover) return;
  if (hover) hover.hsT = 1;
  hover = p;
  if (!p) { tip.classList.remove('on'); cv.style.cursor = ''; return; }
  p.hsT = 1.35; cv.style.cursor = 'default';
  const l = p.line, each = l.paid / l.qty;
  tip.innerHTML = `<b>${l.name.replace(/</g, '&lt;')}</b><span>${l.place.replace(/</g, '&lt;')}</span><i>${when(l.ts)}</i>`
    + `<em>${'₹' + Math.round(each).toLocaleString('en-IN')} paid${l.qty > 1 ? ` · 1 of ${l.qty}` : ''}</em>`;
  tip.classList.add('on');
}
function placeTip() {
  if (!hover) return;
  const r = tip.getBoundingClientRect(), o = 16;
  let x = mx + o, y = my + o;
  if (x + r.width > W - 8) x = mx - r.width - o;
  if (y + r.height > H - 8) y = my - r.height - o;
  tip.style.transform = `translate(${x}px, ${y}px)`;
}
addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
addEventListener('mouseleave', () => { mx = my = -1; setHover(null); });
function hoverTick(sec) {
  if (mx >= 0 && !panel.contains(document.elementFromPoint(mx, my))) setHover(pieceAt(mx, my)); else setHover(null);
  placeTip();
  for (const p of pieces) if (p.hsT || p.hs) {           // ease the hover grow in and out
    p.hs = (p.hs || 1) + ((p.hsT || 1) - (p.hs || 1)) * Math.min(1, sec * 14);
    if (p.hsT === 1 && Math.abs(p.hs - 1) < .005) { p.hs = 1; p.hsT = 0; }
  }
}

// ---------- input ----------
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') search(input.value);
  if (e.key === 'Escape') {
    if (input.value || flying.length) { input.value = ''; release(); }
    else dropAll();                                   // Esc on an empty bar re-drops the whole pile
  }
});
// quick picks type themselves, so a screen recording looks hand-typed
let typing = 0;
function autoType(word) {
  const my = ++typing; input.value = ''; input.focus();
  [...word].forEach((ch, i) => setTimeout(() => { if (my === typing) input.value += ch; }, 90 + i * 85 + Math.random() * 40));
  setTimeout(() => { if (my === typing) search(word); }, 90 + word.length * 85 + 260);
}
// Tab types the next one in this list (no visible buttons; handy while recording)
const PICKS = ['idli', 'pizza', 'kombucha', 'ice cream', 'KFC', 'rasmalai', 'everything'];
let pick = 0;
input.addEventListener('keydown', e => { if (e.key === 'Tab') { e.preventDefault(); autoType(PICKS[pick++ % PICKS.length]); } });
document.addEventListener('click', () => input.focus());
let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => location.reload(), 300); });   // re-fit the pile to the new window

load().then(() => requestAnimationFrame(t => { last = t; frame(t); }));
