# CLAUDE.md — Project Documentation
## Athkar / Daily Wird Static Website

---

## Project Overview

A mobile-first static Arabic website for prophetic supplications (أذكار), deployed via GitHub Pages.

- **Production URL:** https://athkarr.com
- **Staging URL:** https://staging.athkarr.com
- **Production Repo:** https://github.com/abdualhumud/Abdulrahman-
- **Staging Repo:** https://github.com/abdualhumud/Athkar-staging
- **Branch deployed (production):** `master`
- **Branch deployed (staging):** `main`
- **Pages source:** root of each repo's deployed branch

---

## Environments

| | Production | Staging |
|---|---|---|
| **URL** | `https://athkarr.com` | `https://staging.athkarr.com` |
| **Repo** | `abdualhumud/Abdulrahman-` | `abdualhumud/Athkar-staging` |
| **Git remote** | `origin` | `staging-remote` |
| **Deployed branch** | `master` | `main` |
| **noindex** | ❌ No | ✅ Yes |
| **CNAME file** | `athkarr.com` | `staging.athkarr.com` |

### Request Tagging — MANDATORY

Every future request must be tagged:
- **`[STAGING]`** → apply only to `staging-remote/main` — never touches production
- **`[PRODUCTION]`** → apply only to `origin/master` — the live site

**Never mix environments. Never auto-promote staging to production.**

---

## Architecture

Single-file static HTML — no build tools, no backend, no dependencies except Google Fonts.

```
index.html            — 50 duas (جوامع دعاء النبي ﷺ) — canonical root
jawamie-douaa/
  index.html          — Mirror of root index.html (same content, same canonical)
daily-wird/
  index.html          — Daily Wird: 4 Quranic surahs + 3 hadith adhkar
sabah-masa/
  index.html          — Morning & Evening Adhkar: 16 cards
wird.html             — Redirect stub → /daily-wird/
sabah-masa.html       — Redirect stub → /sabah-masa/
404.html              — Custom 404 with JS URL router
CNAME                 — Custom domain file
.nojekyll             — Disables Jekyll on GitHub Pages
CLAUDE.md             — this file
```

---

## Design System

### Colors — Two Themes Only (no others)

| Variable | Cream (default) | Dark / Night |
|---|---|---|
| `--bg` | `#FAF6F0` | `#1A1612` |
| `--card` | `#FFFDF9` | `#242018` |
| `--border` | `#E8DDD0` | `#3A3228` |
| `--accent` | `#7A5C3E` | `#C8A87A` |
| `--accent2` | `#A07850` | `#E0C090` |
| `--text` | `#2C1F0F` | `#F5EDD8` |
| `--muted` | `#7A6652` | `#B0906A` |
| `--ref-bg` | `#F5EDE2` | `#2E2820` |
| `--header-bg` | `#7A5C3E` | `#2E2820` |
| `--header-fg` | `#FFFDF9` | `#F5EDD8` |
| `--counter-bg` | `#7A5C3E` | `#C8A87A` |
| `--counter-fg` | `#FFFFFF` | `#1A1612` |

Theme applied via `data-theme="dark"` on `<html>` (documentElement). Default (cream) uses `:root`.

### Font Sizes

```js
const FONT_SIZES = [
  { label: 'صغير',  px: 18 },
  { label: 'متوسط', px: 24 },  // default index = 1
  { label: 'كبير',  px: 30 },
  { label: 'أكبر',  px: 36 }
];
let fontIdx = 1; // متوسط is default
```

Font: **Amiri** (Google Fonts), Arabic serif.

### Persistence

All pages share the same localStorage keys:
- `athkar-theme` — `'cream'` or `'dark'`
- `athkar-font` — integer index 0–3

---

## Header Layout

### index.html / jawamie-douaa/index.html

```
Row 1: [title-area (title + اللون swatches)] | [font-controls] | [🌙 toggle]
Row 2: [📖 الورد اليومي button — left-aligned (flex-end in RTL)]
```

### daily-wird/index.html / sabah-masa/index.html

```
Row 1: [← رجوع] | [title-area (title + اللون swatches)] | [font-controls] | [🌙 toggle]
```

### Color Swatch Widget

```html
<div class="color-selector">
  <span class="color-label">اللون</span>
  <button class="color-swatch swatch-cream active" id="swatch-cream"
          onclick="setPillTheme(false)"></button>
  <button class="color-swatch swatch-dark" id="swatch-dark"
          onclick="setPillTheme(true)"></button>
</div>
```

- Cream swatch: `#FAF6F0` circle
- Dark swatch: `#1A1612` circle
- Active swatch: white ring `box-shadow: 0 0 0 2.5px #fff` + `scale(1.18)`
- Both swatches stay in sync with the 🌙/☀️ toggle via `applyTheme()`

---

## Basmala Rules — CRITICAL

| Context | Basmala shown? |
|---|---|
| Quranic surah cards (daily-wird, sabah-masa) | **YES** — as a `.basmala-inline` span, verse ﴿١﴾ in Al-Fatiha; as a separate `.basmala` div in other surahs |
| Hadith / dhikr cards | **NO** — never |
| Main page dua cards (index.html / jawamie-douaa) | **NO** — all 50 cards are hadith |

Do NOT add `بسم الله` to any hadith card. This was a recurring mistake to avoid.

---

## Al-Fatiha Verse Numbering

Al-Fatiha is the **only** surah where the Basmala counts as verse ﴿١﴾.

```html
<div class="verses">
  <span class="verse-line basmala-v">
    <span class="basmala-inline">بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</span>
    <span class="verse-num">﴿١﴾</span>
  </span>
  <span class="verse-line">الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ <span class="verse-num">﴿٢﴾</span></span>
  <span class="verse-line">الرَّحْمَنِ الرَّحِيمِ <span class="verse-num">﴿٣﴾</span></span>
  <span class="verse-line">مَالِكِ يَوْمِ الدِّينِ <span class="verse-num">﴿٤﴾</span></span>
  <span class="verse-line">إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ <span class="verse-num">﴿٥﴾</span></span>
  <span class="verse-line">اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ <span class="verse-num">﴿٦﴾</span></span>
  <span class="verse-line">صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ <span class="verse-num">﴿٧﴾</span></span>
</div>
```

For Al-Ikhlas, Al-Falaq, An-Nas: Basmala stays as a separate `<div class="basmala">` (no verse number), verses start at ﴿١﴾.

---

## Quranic Text (Verified)

Use standard Arabic with full tashkeel. Verified text:

### Al-Fatiha (الفاتحة)
بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ﴿١﴾ — الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ — الرَّحْمَنِ الرَّحِيمِ ﴿٣﴾ — مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ — إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ — اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ — صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾

### Al-Ikhlas (الإخلاص) — Basmala + 4 verses
قُلْ هُوَ اللَّهُ أَحَدٌ ﴿١﴾ — اللَّهُ الصَّمَدُ ﴿٢﴾ — لَمْ يَلِدْ وَلَمْ يُولَدْ ﴿٣﴾ — وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ ﴿٤﴾

### Al-Falaq (الفلق) — Basmala + 5 verses
قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ﴿١﴾ — مِن شَرِّ مَا خَلَقَ ﴿٢﴾ — وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ﴿٣﴾ — وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ﴿٤﴾ — وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ ﴿٥﴾

### An-Nas (الناس) — Basmala + 6 verses
قُلْ أَعُوذُ بِرَبِّ النَّاسِ ﴿١﴾ — مَلِكِ النَّاسِ ﴿٢﴾ — إِلَهِ النَّاسِ ﴿٣﴾ — مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ﴿٤﴾ — الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ﴿٥﴾ — مِنَ الْجِنَّةِ وَالنَّاسِ ﴿٦﴾

---

## Daily Wird Page (daily-wird/index.html) — Card Structure

### Quran cards (w1–w4)

```html
<article class="wird-card" id="w1">
  <div class="card-header"><div class="surah-badge">سورة الفاتحة</div></div>
  <!-- Al-Fatiha: Basmala is verse 1 (inline in verses div) -->
  <!-- Other surahs: <div class="basmala">...</div> before <div class="verses"> -->
  <div class="verses">
    <span class="verse-line">...<span class="verse-num">﴿١﴾</span></span>
  </div>
  <div class="wird-ref">...</div>
  <div class="counter-area">...</div>
</article>
```

### Hadith cards (w5–w7) — NO basmala div

```html
<article class="wird-card" id="w5">
  <div class="card-header"><div class="hadith-badge">...</div></div>
  <div class="wird-text">«...»</div>
  <div class="wird-ref">...</div>
  <div class="counter-area">...</div>
</article>
```

---

## Counter Logic

### Jawamie Douaa (index.html / jawamie-douaa) — Unlimited
No maximum limit. Counter increments freely on every tap. Reset returns to zero.
```js
function tapCounter(id) {
  counters[id]++;
  updateCountDisplay(id);
}
```
Progress bar fills on first tap and stays full. No `/ N` max label shown.

### Daily Wird (daily-wird/index.html) — Fixed max per card
```js
const ADHKAR_MAX = { w1: 1, w2: 3, w3: 3, w4: 3, w5: 3, w6: 3, w7: 33 };
```

### Sabah & Masa (sabah-masa/index.html) — Fixed max per card
```js
const ADHKAR_MAX = {
  sm1:1, sm2:1, sm3:1, sm4:10,
  sm5:1, sm6:3, sm7:3, sm8:3,
  sm9:7, sm10:100, sm11:1, sm12:1,
  sm13:3, sm14:3, sm15:3, sm16:3
};
```

---

## Deployment

### Production
```bash
git -c http.sslVerify=false push origin claude/great-rosalind:master
```

### Staging
```bash
# Rebase staging overlay on top of current working branch
git checkout staging
git rebase claude/great-rosalind
# Push to staging
git -c http.sslVerify=false push staging-remote staging:main --force-with-lease
git checkout claude/great-rosalind
```

### Check build status
```bash
# Production
curl -k -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/abdualhumud/Abdulrahman-/pages" | grep "status"

# Staging
curl -k -s -H "Authorization: token TOKEN" \
  "https://api.github.com/repos/abdualhumud/Athkar-staging/pages" | grep "status"
```

- SSL bypass (`-c http.sslVerify=false`) is required on this Windows machine
- Pages build takes ~20–40 seconds after push
- Status changes from `"building"` to `"built"` when live

---

## Promote Staging → Production

```bash
# Changes are already committed on claude/great-rosalind
# Just push to production:
git -c http.sslVerify=false push origin claude/great-rosalind:master
# Never merge the 'staging' branch into master — it carries noindex/staging CNAME
```

---

## Design Rules (User Preferences)

1. **Do NOT redesign** — only refine. Preserve spacing, structure, visual identity.
2. **Only two themes** — Cream and Dark/Night. No green, blue, rose, or other colors.
3. **Default font** — Medium (متوسط, 24px). Not large.
4. **RTL layout** — `lang="ar" dir="rtl"`. In RTL, `flex-end` = visual LEFT.
5. **Basmala** — Quran only. Never add to hadith.
6. **No extra features** — Do not add anything not explicitly requested.
7. **Header design** — warm brown/cream (`#7A5C3E` header). Do not flatten to black/white.
8. **Wird button** — below font controls, aligned to the visual LEFT of the header.
9. **Environment tags** — Every request must be tagged `[STAGING]` or `[PRODUCTION]`.

---

## Common Mistakes to Avoid

| Mistake | Correct approach |
|---|---|
| Adding Basmala to hadith cards | Basmala is Quran-only |
| Setting default font to large (32px) | Default is `fontIdx = 1` (متوسط, 24px) |
| Replacing warm brown header with flat black | Restore `--header-bg: #7A5C3E` |
| Adding a third theme color | Only cream + dark |
| Merging or shortening Quranic verses | Each verse on its own line, exact wording |
| Numbering Al-Fatiha without Basmala as ﴿١﴾ | Basmala = verse 1 in Fatiha only |
| Using `timeout /t` on Windows bash | Use `sleep N` instead |
| Using `findstr` in bash | Use `grep` instead |
| Merging `staging` branch into `master` | Never — staging branch carries noindex |
| Pushing staging changes to `origin/master` | Always use `staging-remote` for `[STAGING]` |
| Pushing production changes to `staging-remote` | Always use `origin` for `[PRODUCTION]` |

---

## Git Workflow

### Branch Map

```
claude/great-rosalind  ← Working/dev branch (production files, no noindex)
staging                ← Working branch + staging overlay on top
                         (noindex + CNAME=staging.athkarr.com)
                         !! NEVER merge to master !!
master                 ← Production branch (clean, no noindex)
```

### Remotes

```
origin          → https://github.com/abdualhumud/Abdulrahman-   (PRODUCTION)
staging-remote  → https://github.com/abdualhumud/Athkar-staging (STAGING)
athkar          → https://github.com/abdualhumud/Athkar          (legacy, unused)
```

### [PRODUCTION] Workflow

```bash
git checkout claude/great-rosalind
# ... edit files ...
git add <files>
git commit -m "Description"
git -c http.sslVerify=false push origin claude/great-rosalind:master
```

### [STAGING] Workflow

```bash
git checkout claude/great-rosalind
# ... edit files ...
git add <files>
git commit -m "Description"

# Rebase staging overlay on top of new commit
git checkout staging
git rebase claude/great-rosalind
git -c http.sslVerify=false push staging-remote staging:main --force-with-lease
git checkout claude/great-rosalind
```

If `index.lock` error appears: find and remove stale lock with `find /c/Users/... -name "*.lock"`.

---

## WhatsApp Reminders Infrastructure

### Cloudflare Worker
- **URL:** `https://athkar-reminders.ngd739.workers.dev`
- **Repo path:** `cloudflare-worker/`
- **API endpoint:** `POST /api/subscribe` — body `{ phone, consent: true }`
- Token stored in Cloudflare Worker secret `WHATSAPP_TOKEN`

### Token Status — CRITICAL
- **Permanent System User token:** ❌ BLOCKED — cannot create until Meta business review clears
- **Temporary token:** Expires every ~24 hours — must be refreshed manually
- **How to refresh:** WhatsApp API Setup page → copy temporary token → update `WHATSAPP_TOKEN` secret in Cloudflare Worker dashboard
- **Permanent fix:** Once Meta review clears → create System User → generate non-expiring token

### Meta Business Account Restriction
- **Business:** Athkarr — Business ID `1587575539115708`
- **Status:** ❌ RESTRICTED — appeal **DENIED** (2026-03-12)
- **Reason:** Meta flagged account for "automation that doesn't follow Advertising Standards on Account Integrity"
- **Root cause:** Likely triggered by the Cloudflare Worker sending WhatsApp messages programmatically
- **Impact:** Cannot create System Users, cannot generate permanent tokens, cannot create/run ads
- **Appeal result:** Review completed and denied on 2026-03-12. No live support channel available for Account Integrity restrictions.
- **Next steps:** Option A — create a new Meta Business Account and start fresh. Option B — wait and try re-appealing via Business Manager "Request review" after a cooling-off period.
- **Note:** No live chat available for this restriction type — all Meta support paths lead to automated review.

### WhatsApp Templates (Pending Approval)
- `adhkar_sabah` — Morning adhkar reminder template — **PENDING**
- `adhkar_masa` — Evening adhkar reminder template — **PENDING**

### Subscription Popup (Staging Only)
- Country code selector `#sub-country` — 15 countries, default Saudi Arabia (+966)
- Phone input: `type="tel"`, `inputmode="tel"`, `autocomplete="tel"`, `name="phone"`
- Validation: strips leading zeros, validates 7–15 digits internationally
- `handleSubscribe()` reads country code dynamically from `#sub-country` — never hardcode +966

---

---

## Production Features Deployed (2026-03-12)

Two features were surgically extracted from staging and deployed to all four production pages:

### 1. WhatsApp Share Button (📤)
- Appears in `.header-icons` group alongside the theme toggle
- Each page shares its own canonical URL:
  - `index.html` / `jawamie-douaa/index.html` → `https://athkarr.com/jawamie-douaa/`
  - `daily-wird/index.html` → `https://athkarr.com/daily-wird/`
  - `sabah-masa/index.html` → `https://athkarr.com/sabah-masa/`
- Uses `navigator.share()` with fallback to `https://wa.me/?text=...`
- **Share-only** — NOT connected to the subscription/notification system

### 2. Add to Home Screen / PWA Install (📲)
- `manifest.json` created at root with `start_url: "/"`, `theme_color: "#7A5C3E"`, `lang: "ar"`, `dir: "rtl"`
- `icon.svg` used as the only icon (`purpose: "any"`, `sizes: "any"`)
- PWA meta tags added to all 4 pages (`<head>`):
  - `<link rel="manifest" href="/manifest.json" />`
  - `mobile-web-app-capable`, `apple-mobile-web-app-capable`
  - `apple-mobile-web-app-title` = "أذكار"
  - `apple-touch-icon` → `/icon.svg`
- Install button hidden by default, shown only when `beforeinstallprompt` fires (Android) or on iOS
- 5-step iOS A2HS guide overlay with Arabic instructions and SVG illustrations
- `sw.js` = **kill switch** (user-intentional) — clears all caches and unregisters itself on activation

### STRICTLY NOT in Production
- WhatsApp notification subscription popup
- Phone number collection or Cloudflare Worker calls
- Any staging-only features (noindex, staging CNAME, subscription UI)

---

### Known Staging Rebase Conflict — Header (d65a4c4)

Staging overlay commit `d65a4c4` ("Fix header layout") explicitly introduces
`href="/daily-wird/"` in its diff. When rebased on top of any commit that
already has `/sabah-masa/`, this causes a conflict or duplicate `header-bottom`.

**Resolution**: staging commit `1776edb` ("Fix: remove duplicate header-bottom")
is a permanent staging overlay that applies AFTER `d65a4c4` and removes the
duplicate, ensuring only one `header-bottom` with `/sabah-masa/` remains.
On future rebases this pair of commits will always conflict+clean correctly.

If the conflict appears again during rebase, resolve by keeping HEAD (which has
`/sabah-masa/`) — the fix commit `1776edb` will clean up the duplicate afterward.
