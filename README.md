# my food pile 🍛

A year of your Swiggy orders, dumped in one big pile. Type a food and every one you ordered jumps out and lines up, with how many, what you actually paid, and when you usually order it. Hover anything to see where it came from.

![A pile of food at the bottom of the screen. Typing "idli" lifts every idli into a neat block with the count and amount paid.](docs/demo.gif)

> I typed **idli**. 42 idlis climbed out of the pile. ₹4,173. Mostly before 11 AM. One order every 11 days. 🫠

**Your orders never leave your computer.** There's no website, no account, and nothing uploaded.

*Fan-made, just for fun. Not affiliated with or endorsed by Swiggy.*

---

## Start here (about 5 minutes, no coding)

### What you need
- **A computer** (Mac or Windows) with **Google Chrome**.
- **An AI coding assistant that can work on your computer.** Any of these will do: [Claude Code](https://claude.com/claude-code), [Codex](https://openai.com/codex/), [Cursor](https://cursor.com), [Gemini CLI](https://github.com/google-gemini/gemini-cli). It does the setup for you, in plain English. *(No assistant? See "Without an AI assistant" below.)*
- Your **Swiggy login** (your phone, for the OTP).

That's it. **Recommended but optional:** letting your assistant read your Swiggy emails in Gmail. It adds your Instamart orders. You can say no and still get a great pile.

### Steps
1. **Download this project.** Click the green **Code** button at the top of this page → **Download ZIP**, then double-click the ZIP to unzip it.
2. **Open the folder in your assistant.** For example: in the Claude desktop app's **Code** tab choose this folder, in Codex or Cursor open the folder, or in a terminal `cd` into it and run `claude`, `codex` or `gemini`.
3. **Type:** `set up my food pile`

Your assistant will say hello, give you a few choices, and walk you through it one step at a time. You'll be asked to **log in to Swiggy yourself**. It never sees or types your OTP. Everything it's allowed to do is written in [`AGENTS.md`](AGENTS.md), if you're curious.

### What your assistant will offer you

| Choice | What you do | What you get |
|---|---|---|
| **1. Your assistant reads swiggy.com** *(easiest)* | Log in on swiggy.com. Only if your assistant can control your Chrome, e.g. Claude Code + the free [Claude in Chrome](https://claude.ai/chrome) extension | Every dish, last 12 months |
| **2. One copy-paste step** | Paste a small script into Chrome. Your assistant shows you how. Works with any assistant | Every dish, last 12 months |
| **3. Swiggy phone app** | Request an *Account Statement* (Food and/or Instamart) in the app, save the PDFs here | One box per order with restaurant and amount. No individual dishes |
| **4. Just the demo** | Nothing | A pile of fake sample orders |

**Gmail (recommended):** swiggy.com doesn't show Instamart orders. If you connect Gmail, your assistant reads only your Swiggy order emails (read-only) to add your Instamart orders, plus your Incognito orders, but only if you ask. It's your choice, and skipping it is fine.

**Incognito orders stay hidden.** If you used Swiggy's Incognito Mode, those orders stay out of your pile. Your assistant can add them from your email receipts, but only if you ask. Worth remembering before you screen-record. 😄

---

## Playing with it

| Do this | What happens |
|---|---|
| Type a food, press **Enter** | Everything matching jumps out of the pile |
| Type a restaurant (`KFC`, `Domino's`) | Everything you ordered from there |
| Type `everything` | The whole pile jumps, with your year's total |
| **Hover** an item | Restaurant, date, time, what you paid |
| **Esc** | Drop them back |
| **Esc** on an empty box | Replay the whole drop |
| **Tab** | Auto-types demo words, handy for screen recordings |
| Add `?size=1.2` to the address | Bigger items (or `0.8` for smaller) |

If a search looks wrong for your orders (say "lassi" grabs something that isn't lassi), just tell your assistant. The instructions explain how to fix it.

## Is it accurate?

- **Money is what you actually paid**, after discounts, fees and taxes. Each order's paid total is shared across its dishes, so everything adds up to your real spend.
- **Counts follow Swiggy's own lines.** "Idly [2 Ps]" counts as one plate of idli.
- **How far back:** about 12 months. That's what swiggy.com keeps.
- **Not included:** Dineout, cancelled orders, and Incognito orders (unless you ask).

## Privacy, plainly

- Your orders are saved only in this folder (`data/raw/` and `data/orders.json`), and git is set to never upload them.
- The app is a page on your own computer (`localhost`). Nothing is sent anywhere.
- The swiggy.com step reads the same order list you see on your Orders page. It isn't an official API, so if Swiggy changes their site it may stop working for a while.

## Without an AI assistant (for the tinkerers)

Using the **ChatGPT** chat app or another chat-only assistant? Those can't run things on your computer, so follow these steps yourself. They take about 5 minutes. (Codex, OpenAI's coding assistant, can do the guided setup above.)

```bash
# 1. Chrome → swiggy.com → log in → Console (Cmd+Option+J / Ctrl+Shift+J)
#    paste tools/swiggy-export.js, press Enter → orders.json downloads
# 2. move it to data/raw/food.json, then:
node tools/build-orders.mjs
python3 -m http.server 5173      # open http://localhost:5173
```

## Make it yours

- **Pictures:** 27 food pictures live in `sprites/`. Anything without one shows an emoji. Want your own? Use the style guide in [`sprites/PROMPTS.txt`](sprites/PROMPTS.txt) with any image generator, save it as `sprites/<name>.png`, and it appears within a few seconds.
- **Your logo or colours:** `index.html`, at the top.

## How it's built

One HTML page, one script, no build step. [Matter.js](https://brm.io/matter-js/) for the physics, with each item's collision shape traced from its picture so pizza slices stack like slices. Made with Claude Code over a few evenings, after a LinkedIn post about my own pile got a bit out of hand.

## License

MIT. Use it, remix it, post your pile. A credit or a tag is lovely. 💛
