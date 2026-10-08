# my-food-pile — instructions for AI assistants

This file is for whichever AI coding assistant the person is using: Claude Code, Codex, Cursor, Gemini CLI or similar. (Claude Code reads it via `CLAUDE.md`, Gemini CLI via `GEMINI.md`.)

You're helping someone turn a year of their own Swiggy orders into a food pile they can play with.
**Assume they've never done anything like this.** They might not know what a terminal, a repo or an extension is.
Be warm, brief and clear. One question at a time. Never pressure them. Every optional thing has an easy "no thanks".

## Ground rules (never break these)

- **They log in themselves.** Never type their phone number, OTP or any password. Open the page, ask them to sign in, wait for "done".
- **Read only.** Never place, change, cancel, reorder, rate or message anything on Swiggy or in their email.
- **Their data stays on their computer**, in `data/raw/` and `data/orders.json`, which git ignores. Never commit it, paste it into an issue, or send it anywhere.
- **No addresses or phone numbers** in anything you write. Receipts contain them, so skip them.
- **Respect Incognito.** Swiggy's Incognito Mode (a toggle in the cart, since Sep 2024) removes an order from the person's history about 3 hours after delivery, but the email receipt is still sent. swiggy.com therefore won't return those orders. Leave them out unless the person explicitly asks to include them.
- If something fails twice, stop, explain in plain words, and offer another route. Don't loop.

## When they say "set up my food pile" (or anything like it)

### 1. Say hello and set expectations
Say roughly this, in your own words:

> Hi! I'll turn your last year of Swiggy orders into a pile of food you can search, like typing "idli" and watching every idli you ordered jump out.
> It takes about 5 minutes. Your orders stay on this computer and nothing is shared.
> Here's the plan I recommend:
> 1. **Your food orders from swiggy.com in Chrome.** You log in, and I'll read your order history. You get every dish you ordered in the last year.
> 2. **Then, if you'd like, your Instamart orders from Gmail.**
> Shall we start? (If you'd rather just see a demo with sample data first, say "demo".)

Then pick the Chrome method yourself, without asking them to choose:
- If you can control their Chrome (see 2a), use **2a**.
- If you can't, use **2b**. They paste one small script and you guide every click. Don't present this as a lesser option. It gets exactly the same data.

**The phone-app statement (2c) is a last resort.** It has no dishes, so the pile can't show idlis, only one box per order. Only offer it if they can't use Chrome on a computer at all, and say plainly what they'll miss.

### 2a. swiggy.com — you read it in their Chrome
This needs a tool that drives **their own logged-in Chrome**: open a tab, run JavaScript in the page and read the result. For Claude Code that's the Claude in Chrome extension (see `CLAUDE.md`). Other assistants may have their own browser extension. If yours runs in a separate cloud browser, it won't have their Swiggy login, so use route 2.
1. If your browser tool isn't connected, tell them what to install for your assistant, or say:
   > If you'd rather not install anything, we can do it with one small copy-paste instead (2b). It's just as good.
2. Open a **new tab** at `https://www.swiggy.com/` and say:
   > I've opened Swiggy in Chrome. Please log in there: top right **Sign in**, then your phone number and the OTP. Tell me "done" when you see your name. I'll never see or type your OTP.
3. When they say done, run `window.__pileNoDownload = true;` then the full contents of `tools/swiggy-export.js` in that tab with your run-JavaScript tool. Tell them: "Reading your orders now. This takes about 30 seconds."
   - If it logs "Session expired" or similar, say kindly that the login didn't stick, and ask them to sign in once more.
4. Read `window.__pileLines` **in batches of 40**: `.slice(0, 40)`, then `.slice(40, 80)`, and so on until a batch comes back empty. Some tools cut off long single strings, but arrays of short lines come back whole.
5. Write every line, unchanged and in order, to `data/raw/food-lines.txt`. Close the tab you opened.
6. Continue at **step 3 (Instamart, optional)**.

### 2b. swiggy.com — they paste one small script (any assistant)
Walk them through it slowly, one step per message, and wait for "done" after each:
1. "Open **https://www.swiggy.com** in Chrome and log in."
2. "Press **Cmd + Option + J** (Mac) or **Ctrl + Shift + J** (Windows). A panel called Console opens. It looks technical, and that's fine."
3. "I've copied a small script for you." Copy `tools/swiggy-export.js` to their clipboard (`pbcopy < tools/swiggy-export.js` on Mac, `clip < tools\swiggy-export.js` on Windows). Then: "Click inside the Console, paste with **Cmd/Ctrl + V**, and press **Enter**. If Chrome asks you to type `allow pasting`, type it and paste again. That's Chrome being careful, and this script only reads your order list."
4. "In about 30 seconds a file called **orders.json** downloads. Tell me when it's there."
5. Move it yourself: find the newest `orders.json` in their Downloads folder and move it to `data/raw/food.json`. If you can't find it, ask them to drag it into this folder.
6. Continue at **step 3**.

### 2c. Last resort — the Swiggy phone app (only if they can't use Chrome on a computer)
Say:
> In the Swiggy app: tap your **profile** (top right), then **Account Statements** (it may be called **Order Summary**). Choose **Food**, pick the dates (up to a year), and request it. Then do the same for **Instamart** if you use it. Swiggy emails you a PDF in a few minutes. Save the PDFs into the `data/statements` folder here, or just tell me where they are, and say "done".

Read each PDF. Most assistants can read PDFs directly; otherwise use `pdftotext` or ask them to open it and paste the table. The statement lists **date, order ID, restaurant and amount**, with no individual dishes. What we've seen in real statements:
- **Dates are day-first:** `07-10-2026` is 7 October. The PDF's own filename or title can read like "Jan 10 to Aug 10", so don't trust it. Read the "Date Range" field.
- **Food:** columns are Date, Order ID, Restaurant Name, Amount. Amounts can be a little **lower** than what was actually paid (seen 4–11% lower), and some dessert or sweet-shop orders may be missing. Say so.
- **Instamart:** columns are Date, Order ID, **Pod Name**, Amount. Pod Name is the warehouse that packed the order, not a product, so use `"place": "Instamart"`. Amounts matched what was paid.
- Only a date, with no time, so use 12:00 as the time. Build `data/raw/statements.json` as `{ "orders": [ { "ts": "YYYY-MM-DD 12:00", "place": "...", "total": 123.45, "items": [ { "name": "<restaurant>", "qty": 1, "price": 123.45 } ] } ] }`, using source `"food"` or `"instamart"` per file (the logo and columns tell you which). Tell them honestly:
> Heads up: the statement doesn't list dishes, so your pile will show one box per order. Searching works by restaurant ("KFC", "Domino's"), not by dish. If you'd like dishes later, the swiggy.com route in Chrome takes about 2 minutes.

### 2d. Demo only
Start the app (step 5) without building anything. It shows fake sample data and says so at the bottom. Mention they can come back any time and say "set up my food pile".

### 3. Gmail: recommended, never required (ask once)
Gmail makes the pile noticeably better, so recommend it clearly, once, and accept "no" happily. Say roughly:
> One more thing, and I'd recommend it: **let me read your Swiggy emails in Gmail** (read-only, just the order emails). That adds:
> - your **Instamart** orders, which swiggy.com doesn't show,
> - and, only if you ask, orders you placed in **Incognito Mode** (Swiggy hides those from your history).
> I only look at emails from Swiggy, I never send or delete anything, and nothing leaves your computer.
> Want me to add them? It's completely fine to say no, and the pile works great without it.

- If they say no, say "No problem!" and move on. Don't ask again or mention what they're missing.
- If yes and you have access to their Gmail (a connector or integration): search `subject:"Instamart order" "successfully delivered" newer_than:1y` (senders vary: `noreply@instamart.in`, `noreply@swiggy.in`, `no-reply@swiggy.in`). From each email take the order time (email date in IST), the items (`1 x Name … ₹price`, where price is the line total; strip text after ` | `; skip ₹0 freebies) and the **Grand Total**. Write `data/raw/instamart.json` as `{ "orders": [ { "ts": "2026-09-26 20:01", "items": [ { "name": "Amul Lassi", "qty": 2, "price": 40 } ], "total": 52 } ] }`.
- If yes but you have no Gmail access yet, explain in one or two lines how to connect Gmail in their assistant's settings (for Claude: Settings → Connectors → Gmail) and wait. If their assistant can't connect Gmail, suggest the Instamart statement from route 3 instead.

**Incognito orders:** don't go looking for them. Only if the person asks, e.g. "some orders are missing", explain:
> Swiggy hides orders placed in **Incognito Mode** from your history. If you want them in the pile, I can add them from your email receipts. Only you will see them, but keep it in mind if you ever screen-record this.

Then, and only with a clear yes, add the missing food orders from receipt emails into `data/raw/food-lines.txt`, in the same format. Search `from:(noreply@swiggy.in OR no-reply@swiggy.in) subject:("Your Swiggy order" OR "Your Swiggy Gourmet order") newer_than:1y`, because some restaurants send "Gourmet" receipts. From each receipt take the placed time (first time under ORDER JOURNEY), the restaurant (the brand name, without the legal company text), the items from BILL DETAILS (name, qty, price) and the "Paid Via …" amount. Add only receipts with no match in the web list on the same day within 15 minutes and ₹2. Orders found only in email are almost always Incognito orders.

Good to know (from testing on a real account): some shops, mostly sweet and dessert shops, never send a receipt email, so the web list has orders that email doesn't. Never replace the web list with emails. Only add to it.

### 4. Build and sanity-check
Run `node tools/build-orders.mjs` (if Node isn't installed, say so plainly and help them install it from https://nodejs.org, LTS version). Read the summary back in human words and ask if it feels right:
> Found 160 food orders from Oct 2025 to Sep 2026, ₹59,935 paid in total. Does that sound about right?

If they say a number looks off, look before guessing: check for incognito, cancelled orders, or the 12-month limit.

### 5. Start it
Run `python3 -m http.server 5173` from this folder in the background (or `npx serve -l 5173 .` if Python is missing), open http://localhost:5173, and say:
> Your pile is ready. Give it 5 seconds to fall.
> - Type a food and press **Enter**. Try "pizza", "chai" or a restaurant name.
> - **Hover** any item to see where and when you ordered it.
> - **Esc** puts things back. **Esc** on an empty box replays the drop.
> - Want bigger items for a screen recording? Add `?size=1.2` to the address.
> Have fun, and if any search looks wrong, just tell me and I'll fix it.

## How the app thinks (for fixes)

- `app.js` → `CATS`: which **picture** an item gets. Each has a name (= `sprites/<name>.png`), a regex on the item name, a physics size, and an emoji fallback. Anything unmatched becomes `takeaway`.
- `SYN`: what a **search word** matches, beyond its literal spelling (e.g. `idli` also finds "Idly").
- `NOT`: phrases that stop a word from matching (e.g. `egg` must not match "Eggless", `veg` must not match "Non-veg").
- Matching is whole-word and plural-tolerant (`wordRe`, `forms`). Never go back to plain substring matching: "Classic" contains "lassi".
- Paid amounts: each order's paid total is shared across its items by menu price, so everything adds up to what was actually paid.

### Fixing search (common requests)
- "X shows things that aren't X": add a `NOT` rule, or tighten `SYN[x]` with `\b`.
- "X misses some X": add the missing names to `SYN[x]` (e.g. pizzas called "Farmhouse" with no word "pizza").
- "Wrong picture": edit that `CATS` regex, or add a category plus `sprites/<name>.png` (transparent, ~384px, style guide in `sprites/PROMPTS.txt`).
- After changes, run `node tools/qa/matches.cjs` and `node tools/qa/stress.cjs` (they need `npm i -D puppeteer-core` and Chrome) and read the matches yourself.
