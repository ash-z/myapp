# Wedding invitation — handoff

Live: https://ash-z.github.io/myapp/ (GitHub Pages, branch `claude/add-threejs-library-ogt1s7`, folder `/docs`).
`docs/index.html` is **generated** — edit the files here, then rebuild:

```sh
cd invite-src && npm install && python3 build.py          # -> ../docs/index.html, build/artifact.html
node og.mjs "$PWD/../docs/index.html" /tmp/og.png         # link-preview image; convert to ../docs/og.jpg
```

| File | What it holds |
|---|---|
| `style.html` | `<title>`, font link, all CSS. Palettes are tokens: ivory = light, jewel = dark |
| `body.html` | all markup: opening screen, 5 screens, tab bar |
| `app.js` | `CONFIG` at the top (photos, share URL), then palette, particles, tilt, opening, tabs, photo deck, countdowns, blessings, the three.js sea |
| `three-entry.js` | the three.js symbols esbuild keeps; add to it if `app.js` needs more |

## Locked decisions
- Names: **Sai Susmita** in formal places (opening screen, hero, families, closing, title, previews); **Susmita** in casual ones (photo deck). The woman is always named first.
- Two events only: muhurtam Thu 29 Oct 2026 7:29 PM, Hotel Ambica Sea Green, Visakhapatnam; reception Sun 1 Nov 2026 11:00 AM, Hotel Tulip Grand, Annojiguda, Hyderabad.
- Type: Italiana / Marcellus / Karla / Noto Sans Telugu. Palettes ivory + jewel, toggle top-right.
- three.js is **inlined**, never loaded from a CDN (a CDN load silently failed before).
- No copy the couple did not supply. Keep it plain; no invented backstory.
- No framed oval portraits side by side — in India that reads as a memorial photo. Photos live in the swipeable deck.
- No algorithmic line-art or posterised portraits (tried twice, rejected).

## Screens
Invite (the sea) · Us (photo deck) · Wedding · Reception · RSVP · Blessings — six tabs, each its own full screen. Both tickets carry the same days/hours/mins/secs countdown.
The invitation is a **pager**: pages are stacked full-screen layers and only the active one shows (`.js` styles; without JS it degrades to one scrolling document).
- Scroll, swipe or arrow keys / Page Up/Down / Space at a page's edge turn the page. The next page rises under a row of temple arches with a gold line riding the edge (line and mask are driven from the same thread so they never drift); going back runs downward.
- **Pages never scroll.** Every page fits one screen: layouts are compact, and the FIT module in app.js scales a page's
  content as a whole (like a slide) when a small phone can't fit it — measured: no scaling on 390×844, 412×915, 430×932;
  79–87% on 375×667 and 360×640. Below 62% (a phone held sideways) the page scrolls rather than shrinking further.
- The RSVP guest list opens in a bottom sheet ("See who's coming"), the one place that scrolls; page turns pause while it's open.
- A link to `#rsvp` (or any page id) while the invitation is open turns to that page.
- One trackpad flick turns at most one page: input during a turn, and until it has been quiet for 250ms after it, is swallowed.
- Tab taps bloom the page open from the tab; tapping the current tab scrolls that page to its top.
- Modules listen for `pagechange` / `pagesettle` events instead of IntersectionObserver (stacked pages all intersect the viewport). The sea renders only while its page shows.
- Tapping the sea floats a lamp only on a real tap; a swipe turns the page instead.

## RSVP
`rsvp/Code.gs` is a Google Apps Script web app over the couple's Google Sheet. Setup steps: `rsvp/SETUP.md`.
Put the deployed `/exec` URL in `CONFIG.rsvp.endpoint` (app.js) and rebuild; until then the form says RSVPs open soon.
- Guests give a full name (first + last required), then answer the wedding and the reception separately: Attending / Can't make it, with a separate party size (1–10) for each. Both must be answered.
- Sheet columns: Updated, Token, Full name, Wedding, Wedding guests, Reception, Reception guests.
- The page shows a guest list per event (Wedding / Reception switch) with its own head count.
- Each phone keeps a token in localStorage; answering again updates the same sheet row.
- The page only ever receives "First L." names and a head count; full names stay in the sheet.
- Guards: honeypot field, token and length validation, names can't become sheet formulas, LockService around writes.
- Tested by running Code.gs in Node with stand-ins for the Google services (upsert, validation, formula guard, honeypot) and a full browser flow against it. Not yet tested against a real Apps Script deployment.
- The claude.ai artifact preview blocks outside requests, so RSVP only works on GitHub Pages.

## Photographs
The couple's photos are in `photos/` (phone screenshots, ~1200px wide). `photos_process.py` crops each to a 4:5 card
(crops chosen by eye to frame faces and drop relatives at the edges) and writes `photos/out/*.webp` at 800×1000.
Deck order: laughing together (lead, captioned) · Susmita · Ashish · seated portrait · with garlands · the ring.
On GitHub Pages the photos are separate files in `docs/photos/` (the page stays ~1.1MB); the artifact embeds them.
To add or reorder: add the file to `photos/`, add a line to `DECK` in `photos_process.py`, add a `<figure>` and a dot in
`body.html`, then run `photos_process.py` and `build.py`. The deck shows three cards in its stack at a time.

## Illustrations (from the couple's Canva)
All art lives in `art/` (WebP for the build, PNG lossless masters) and is embedded once in the page as `window.ART`;
every `<img data-art="name">` shares it. Ganesha is a CSS mask (`--ganesha-img`) so it takes the theme colour.

| Art | Used on |
|---|---|
| `toranam` (mango leaves, marigold, jasmine, brass bells) | top of the opening screen, the sea, and Blessings; Ganesha hangs in its centre gap |
| `ganesha` (line art; Canva stock element "lord ganesha", from the engagement invitation) | centre of the toranam on the opening screen and the sea |
| `couple` (bride and groom holding hands) | opening screen, in front of the kolam; the "together" photo card until a photo arrives |
| `gopuram` | rising from the wedding ticket |
| `corner-left`, `corner-right` | opening screen bottom corners; reception ticket top corners (flipped) |
| `diya` (with sprig) | RSVP card corner |
| `peacock` | Blessings, a facing pair |

**How they were extracted** (this environment blocks Canva's download host, `export-download.canva.com`):
each illustration was placed alone on a solid magenta page in a workbench copy (`DAHV9YJ2Iq0`) of the art sheets, each
page copied out as its own one-page design (Canva only stores previews for page 1), and the stored preview's S3 copy
downloaded. `art_process.py urls.json` keys out the magenta (unmixing it from soft edges), stitches tiles (the couple
is 2 tiles, the toranam 3) and trims. The source images are small (the peacock is 277×540), so the previews lose nothing.
The toranam's big centre flower lived in its sheet's background image, so the garland has a gap — that is where Ganesha sits.

Licensing: the Ganesha is Canva stock content, used inside this design. Don't offer any piece as a standalone download.
Canva designs created along the way (safe to delete once happy): the workbench `DAHV9YJ2Iq0` and its 11 one-page copies;
also junk from generation: `DAHV9DpqFrs`, `DAHV9AoBxNs`, `DAHV9IZyYZ4`.

## Open items
- The "forgot him for a couple of days" joke — never confirmed as family-safe; not on the page.
- RSVP — built; waiting on the couple to deploy `rsvp/Code.gs` (see above).
- Travel/stay for outstation guests — one placeholder line under the reception ticket.
