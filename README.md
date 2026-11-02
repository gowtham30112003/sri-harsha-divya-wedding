# Sri Harsha & Divya Sudha – Wedding Invitation Website

Plain HTML + CSS + JavaScript. No build step, no installs, no frameworks.

```
wedding-invitation/
├── index.html          ← the whole invitation
├── css/style.css       ← design (colours at the top in :root)
├── js/main.js          ← opening, countdown, calendar, animations
├── js/music.js         ← background music + mute button logic
├── assets/
│   ├── favicon.svg
│   ├── apple-touch-icon.png
│   ├── og-image.png    ← the picture WhatsApp shows when the link is shared
│   └── music.mp3       ← OPTIONAL – see "Music" below
└── README.md
```

## 1. Run it on your computer

Option A – just double-click `index.html`. (Fonts need internet; everything else works offline.)

Option B – local server (needed to test on your phone over Wi-Fi):

```bash
cd wedding-invitation
python3 -m http.server 8000
```
Open http://localhost:8000. On a phone on the same Wi-Fi, open `http://<your-computer-IP>:8000`.

## 2. Publish online and get a shareable link (free)

**Easiest – Netlify Drop (about 1 minute, no account setup needed to try)**
1. Go to https://app.netlify.com/drop
2. Drag the whole `wedding-invitation` folder onto the page.
3. You get a link like `https://random-name.netlify.app`. In *Site settings → Change site name* make it something nice, e.g. `sriharsha-divya.netlify.app`.

**Alternatives:** Cloudflare Pages (Direct Upload), GitHub Pages (push the folder to a repo → Settings → Pages → deploy from `main`), or Vercel (`npx vercel`).

## 3. WhatsApp preview (do this once after publishing)

WhatsApp needs the *full* web address of the preview image. Open `index.html`, find the two lines containing `https://YOUR-SITE-URL` (the `og:url` and `og:image` tags) and replace `YOUR-SITE-URL` with your real address, e.g.

```html
<meta property="og:url"   content="https://sriharsha-divya.netlify.app/">
<meta property="og:image" content="https://sriharsha-divya.netlify.app/assets/og-image.png">
```
Re-upload the folder. Then paste the link in WhatsApp – it shows the title, date/venue text and the invitation picture.
WhatsApp caches previews: if you shared the link *before* fixing this, add `?v=2` to the link when sending.

## Music

* The tap on the envelope ("Tap to Open") starts the music – this is what makes it work on iPhone and Android, which block sound until the visitor interacts.
* If a browser still blocks it, music starts on the visitor's first tap/click/key press.
* It loops continuously; the round button (top-right) mutes/unmutes. It pauses automatically when the visitor switches apps or tabs.
* **Built-in instrumental:** with no audio file present, the site generates a soft Indian instrumental live in the browser (tanpura drone + bamboo-flute melody in raga Bhoopali + temple bell). Nothing to download, no copyright issues.
* **Use a real recording instead:** put a royalty-free MP3 at `assets/music.mp3` (keep it under ~4 MB so it loads quickly on mobile data). It is picked up automatically. Free sources: Pixabay Music, YouTube Audio Library, Free Music Archive – search "Indian wedding instrumental", "shehnai", "flute", "veena" and check the licence allows web use.

## Things you may want to edit

| What | Where |
|---|---|
| Countdown target | top of `js/main.js` → `MUHURTHAM` (currently 15 Nov 2026, 10:15 AM IST) |
| Names, family text, venue | `index.html` |
| Google Maps "Directions" link | `index.html` → the `DIRECTIONS` button (searches the venue name; replace with your exact Google Maps share link for a precise pin) |
| Colours | `css/style.css` → `:root` variables |

## What was intentionally left out

No photo gallery or pictures, no RSVP form, no extra sections beyond the reference layout:
opening envelope → hero → story band → welcome/invitation → ceremony & venue → calendar → family blessings → countdown → thank-you.
