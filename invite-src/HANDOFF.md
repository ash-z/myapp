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
Invite (the sea) · Us (photo deck) · Events (wedding + reception tickets; Wedding/Reception switch, swipe on phones, side by side on wide screens) · RSVP · Blessings.
Tab taps bloom the next screen open from the tab (View Transitions API; a quick veil where unsupported; a plain jump for reduced motion).
Each screen's top edge is a row of temple arches, and content drifts in staggered.

## RSVP
`rsvp/Code.gs` is a Google Apps Script web app over the couple's Google Sheet. Setup steps: `rsvp/SETUP.md`.
Put the deployed `/exec` URL in `CONFIG.rsvp.endpoint` (app.js) and rebuild; until then the form says RSVPs open soon.
- Guests give a full name (first + last required), events, party size (1–10); "can't make it" records a No.
- Each phone keeps a token in localStorage; answering again updates the same sheet row.
- The page only ever receives "First L." names and a head count; full names stay in the sheet.
- Guards: honeypot field, token and length validation, names can't become sheet formulas, LockService around writes.
- Tested by running Code.gs in Node with stand-ins for the Google services (upsert, validation, formula guard, honeypot) and a full browser flow against it. Not yet tested against a real Apps Script deployment.
- The claude.ai artifact preview blocks outside requests, so RSVP only works on GitHub Pages.

## Next: the illustrated art layer (Canva)
The couple wants illustrated art **throughout** the invitation, in the spirit of their engagement invitations (Canva designs `DAHTZLG9LZ4`, `DAHTZPuwew0`). Selected pieces, all in their Canva account:

| Piece | Canva design | Placement |
|---|---|---|
| Bride & groom facing each other under a carved mandapam | `DAHV9AW397E` | opening screen and/or "The two of them" |
| Alt couple, frontal, mango-leaf canopy (has AI gibberish text bottom-left — remove) | `DAHV9A5pn-k` | alternate |
| Toranam with brass bells, golden peacock, diya with sprig | `DAHV9HvKffw` | toranam atop the opening screen + section heads; peacocks beside the seal and on blessings; diya accents |
| Rich marigold toranam, gopuram | `DAHV9PFUJZw` | gopuram on the wedding ticket (its bride figure is unusable: braid turns into peacock feathers) |
| Floral corner sprigs | `DAHV9DV2IEw` | reception ticket, section corners |
| Junk to delete | `DAHV9DpqFrs`, `DAHV9AoBxNs`, `DAHV9IZyYZ4` | — |

How to pull them in:
1. The session needs network access to `export-download.canva.com` (and `canva.com`, `media.canva.com`, `design.canva.ai`). Exports are served from `export-download.canva.com`; without it only 376px thumbnails come through, which are too small.
2. Export each as PNG at width ~2400 (`transparent_background: true` if the account has Canva Pro).
3. Without transparency, key out the flat ivory background in PIL (soft alpha by distance from the background colour), then crop each element by connected-component bounding boxes.
4. Save optimised PNG/WebP files under `docs/art/` and reference them by path; GitHub Pages serves them and they load lazily. For the artifact build, inline them as data URIs.
5. Use the art as part of the invitation's design only — do not offer the raw pieces as standalone downloads (Canva content licence).

## Open items
- Real photos: attach 3 (Susmita, Ashish, together), 4:5 portrait; set `CONFIG.photos[i].src`.
- The "forgot him for a couple of days" joke — never confirmed as family-safe; not on the page.
- RSVP — built; waiting on the couple to deploy `rsvp/Code.gs` (see above).
- Travel/stay for outstation guests — one placeholder line under the reception ticket.
