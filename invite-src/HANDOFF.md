# Wedding invitation — handoff

Live (GitHub Pages, branch **`golden`**, folder `/docs`), two versions of one invitation:
- **Relatives:** https://ash-z.github.io/myapp/ (`docs/index.html`)
- **Friends:** https://ash-z.github.io/myapp/friends/ (`docs/friends/index.html`): the same, plus the day-before page

Both pages are **generated**: edit the files here, then rebuild:

```sh
cd invite-src && npm install && python3 build.py          # -> ../docs/{,friends/}index.html, build/artifact{,-dev}{,-friends}.html
node og.mjs "$PWD/../docs/index.html" /tmp/og.png         # link-preview image; convert to ../docs/og.jpg
```

| File | What it holds |
|---|---|
| `style.html` | `<title>`, font link, all CSS. Palettes are tokens: ivory = light, jewel = dark |
| `body.html` | all markup: opening screen, the screens, tab bar; `<!--friends-->` blocks are friends-only |
| `app.js` | `CONFIG` at the top (photos, share URL), then palette, particles, tilt, opening, tabs, photo deck, countdowns, blessings, the three.js sea |
| `three-entry.js` | the three.js symbols esbuild keeps; add to it if `app.js` needs more |

## Golden and dev
- **`golden`** is what guests see. GitHub Pages serves it; nothing is committed to it directly.
  `golden-v1` (commit `4bcc0d7`) is the version first shared with guests.
- **`claude/add-threejs-library-ogt1s7`** is where work happens. Its previews are the dev artifacts
  (`build/artifact-dev.html` and `build/artifact-dev-friends.html`, marked DEV); the golden preview artifact is `build/artifact.html`.
- **Promote** only when the couple says so, after checking the dev preview on a phone:
  ```sh
  git checkout golden && git merge --ff-only claude/add-threejs-library-ogt1s7 && git push origin golden
  git checkout claude/add-threejs-library-ogt1s7
  ```
  Pages redeploys in about a minute. To roll back, reset `golden` to the previous good commit and push.

## Locked decisions
- Names: **Sai Susmita** in formal places (opening screen, hero, families, closing, title, previews); **Susmita** in casual ones (photo deck). The woman is always named first.
- Two events for everyone: **sumuhurtam** Thu 29 Oct 2026 **7:31 PM**, **'Marina' Banquet Hall**, Hotel Ambica Sea Green, Beach Road, Visakhapatnam;
  reception Sun 1 Nov 2026 **11:00 AM onwards**, Hotel Tulip Grand, **5th floor**, Annojiguda, Hyderabad
  (hall name not known yet; add it next to the floor when the couple sends it).
- **Friends only**, Wed 28 Oct 2026: Haldi 9:30 AM · Pellikuturu 11:30 AM · Mehendi & Sangeet 5:30 PM onwards.
  All at Home, near Sivaji Park, MVP Colony, Vizag. These must never appear in the relatives' version. It is the only difference between the two.
- Type: **Alex Brush** (the couple's names only) / **Tiro Telugu** (headings, ticket dates, the closing line; its Latin is
  drawn to sit with Telugu script) / Marcellus (times, venues) / Karla (body, labels) / Noto Sans Telugu (Telugu labels).
  The couple chose this pairing from six traditional options; generic serifs (Cormorant, Playfair, Cinzel, Lora…) were rejected
  as not matching the page. Palettes ivory + jewel, toggle top-right.
- **Readability comes first** (the couple asked for it): no text below 12px (tab labels excepted, 9.5–12px by width),
  small capitals tracked no wider than .12em, body text regular weight, and light-theme gold/grey text at ≥4.5:1
  (`--gold:#8A6420`, `--muted:#6B5B47`). Italiana, the first display face, was too thin to read and was dropped; Cormorant Garamond after it didn't suit.
  Short screens (≤740px tall) get a compact layout (less spacing, smaller ornaments) so the text doesn't shrink.
- three.js is **inlined**, never loaded from a CDN (a CDN load silently failed before).
- No copy the couple did not supply. Keep it plain; no invented backstory.
- **Telugu: natural words only**, one small label per page, never a word-for-word gloss that no Telugu card would use.
  The couple rejected made-up labels (మీ రాక, పెద్దలు, వధూవరులు, వివాహం as a ticket tag, the "&" signature). In use now:
  ॥ శ్రీ గణేశాయ నమః ॥ and శుభలేఖ (opening screen, Invite) · సుస్మిత / ఆశిష్ (photo captions) · వివాహ ముహూర్తం (Wedding) ·
  రిసెప్షన్ (Reception; the couple chose it over the brief's ఆశీర్వచనం) · మీరు వస్తున్నారా? (RSVP) · ఆశీస్సులతో (Blessings) · అక్షింతలు (the note under Shower akshintalu).
  The Us page has no Telugu label.
- No framed oval portraits side by side — in India that reads as a memorial photo. Photos live in the swipeable deck.
- No algorithmic line-art or posterised portraits (tried twice, rejected).

## Screens
Invite (the sea) · Us (photo deck) · Wedding · Reception · RSVP · Blessings — six tabs, each its own full screen. Both tickets carry the same days/hours/mins/secs countdown.
The friends' version adds a seventh, **Haldi** ("The day before"), between Us and Wedding: one ticket with the day's three
events at **Home, near Sivaji Park, MVP Colony, Vizag**, a countdown to the haldi, Directions (the couple's pin for
the house, https://maps.app.goo.gl/4jKmVR2unpEwwRWNA) and an all-day "Save date". A toranam hangs
along the ticket's top edge with Ganesha in its gap.

**Two versions:** anything between `<!--friends-->` and `<!--/friends-->` lines in `body.html` is only in the friends'
version (`build.py` drops it for the relatives'), and the friends' page sets `window.INVITE = "friends"`, which `app.js`
reads for its share link and the RSVP. The tab bar sizes itself to however many tabs there are.
The invitation is a **pager**: pages are stacked full-screen layers and only the active one shows (`.js` styles; without JS it degrades to one scrolling document).
- Scroll, swipe or arrow keys / Page Up/Down / Space at a page's edge turn the page. The next page rises under a row of temple arches with a gold line riding the edge (line and mask are driven from the same thread so they never drift); going back runs downward.
- **Pages never scroll.** Every page fits one screen: layouts are compact, and the FIT module in app.js scales a page's
  content as a whole (like a slide) when a small phone can't fit it — measured: no scaling on 390×844, 412×915, 430×932;
  79–87% on 375×667 and 360×640. Below 62% (a phone held sideways) the page scrolls rather than shrinking further.
- The RSVP guest list opens in a bottom sheet ("See who's coming"), the one place that scrolls; page turns pause while it's open.
- A link to `#rsvp` (or any page id) while the invitation is open turns to that page.
- The opening screen shows on every visit. Only a link that arrives with `#page` skips it (a deliberate deep link);
  the pager does not write the page into the address, so reloading always returns to the cover.
- One trackpad flick turns at most one page: input during a turn, and until it has been quiet for 250ms after it, is swallowed.
- Tab taps bloom the page open from the tab; tapping the current tab scrolls that page to its top.
- **No Next button and no "swipe up" text:** the couple had both removed; the side rail is the page-turn control.
- **Side rail** (`#rail`), fixed on the right edge: ▲ / a dot per page (current one gold) / ▼, 20px wide so it sits in
  the 24px page margin beside tickets and cards, never over them (it used to cover the tickets' right edge, which looked
  misaligned). The section blinks gently: ▲ and ▼ fade and nudge in turn, and a soft gold glow breathes around
  it (off under reduced motion). ▲ on the first page and ▼ on the last page go to the cover.
- **Back to the cover:** ▲ or a swipe down (or wheel/arrow up) on the first page; ▼ or a swipe up on the last page. The cover slides back down over the invitation (which resets to its first page) and
  opens again as usual (`cover.close()` in the opening module).
- **Cues:** on the cover, the arrow in "Open invitation" nudges and blinks and a gold ring pulses from the button
  (tapping the photo opens it too). The rail blinks gently. **Welcome shimmer:** when the invitation opens (or a shared
  #page link lands), a soft gold light sweeps across the tab bar three times and then it rests; the couple chose this
  over a tab bar that flashes all the time (too busy, pulls the eye off the details). All of it stops under reduced motion.
- Modules listen for `pagechange` / `pagesettle` events instead of IntersectionObserver (stacked pages all intersect the viewport). The sea renders only while its page shows.
- Tapping the sea floats a lamp only on a real tap; a swipe turns the page instead.

## Blessings: the two families
The bride's and groom's parents sit in two mirrored columns with a gold rule between. Their three lines share rows
across the columns (CSS subgrid), both sides break at the same places ("Parents of / the bride", "Chandrika & /
Srinivasulu Gorantla"), the children's names sit on their own line, and the parents' names scale with the screen so
"Suresh Bhimanpalliwar" (the longest line) always fits. Checked identical line-for-line from 360px to desktop.

## Music
The couple's song lives in **`docs/music/`** as `song.mp3` (or `song.m4a` / `song.wav`); see the README there.
The pages point at that folder, so a file uploaded there plays without a rebuild; the artifact previews embed it
(rebuild after adding one). It starts when a guest taps "Open invitation" (phones need a tap before sound), loops,
pauses when the page is hidden, and the speaker button next to Ivory/Jewel pauses/resumes it (remembered per phone).
With no file the button stays hidden and the page is silent. Copyrighted film songs on a public page can draw a
takedown; that's the couple's call.

## RSVP
`rsvp/Code.gs` is a Google Apps Script web app over the couple's Google Sheet. Setup steps: `rsvp/SETUP.md`.
Put the deployed `/exec` URL in `CONFIG.rsvp.endpoint` (app.js) and rebuild; until then the form says RSVPs open soon.
- Guests give a full name (first + last required), then answer the wedding and the reception separately: Attending / Can't make it, with a separate party size (1–10) for each. Both must be answered.
- Sheet columns: Updated, Token, Full name, Wedding, Wedding guests, Reception, Reception guests, Invite (Friends or Relatives: which link they answered from). Both versions share one sheet and one guest list.
- The page shows a guest list per event (Wedding / Reception switch) with its own head count.
- Each phone keeps a token in localStorage; answering again updates the same sheet row.
- The page only ever receives "First L." names and a head count; full names stay in the sheet.
- Guards: honeypot field, token and length validation, names can't become sheet formulas, LockService around writes.
- Tested by running Code.gs in Node with stand-ins for the Google services (upsert, validation, formula guard, honeypot) and a full browser flow against it. Not yet tested against a real Apps Script deployment.
- The claude.ai artifact preview blocks outside requests, so RSVP only works on GitHub Pages.

## Photographs
The couple's photos are in `photos/` (phone screenshots, ~1200px wide). `photos_process.py` crops each to a 4:5 card
(crops chosen by eye to frame faces and drop relatives at the edges) and writes `photos/out/*.webp` at 800×1000.
Deck order: laughing together (lead, captioned) · Susmita · Ashish · seated portrait · the ring. (The standing-with-garlands photo was removed at the couple's request; its source screenshot is still in `photos/`.)
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
| `couple` (bride and groom holding hands) | **retired** — its garland on the bride was drawn wrong (strands hanging like a stole). The opening screen now shows the couple's seated portrait (`photos/out/cover.webp`) in a temple-arch window before the kolam |
| `gopuram` | rising from the wedding ticket |
| `toranam` + `ganesha` (again) | hung along the top of the friends' day-before ticket |
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
