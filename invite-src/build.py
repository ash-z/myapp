"""Assemble the invitation into one self-contained page.

    cd invite-src && npm install && python3 build.py

Builds two invitations from the same files: the relatives' one and the
friends' one (which adds the day-before page). For each it writes the page
GitHub Pages serves (docs/index.html, docs/friends/index.html), the same page
without <head> for a Claude artifact (build/artifact[-friends].html), and that
with a DEV badge for the dev preview (build/artifact-dev[-friends].html).
three.js is tree-shaken by esbuild and inlined, so the page makes no
runtime request except the Google Fonts stylesheet.
"""
import pathlib, subprocess

here = pathlib.Path(__file__).resolve().parent
root = here.parent
build = here / "build"
build.mkdir(exist_ok=True)

subprocess.run(["npx", "esbuild", "three-entry.js", "--bundle", "--minify", "--format=iife",
                "--global-name=THREE", "--outfile=build/three.min.js", "--legal-comments=none"],
               cwd=here, check=True)

import base64, re

def inline_art(text):
    """Replace {{art:name}} with the art/name.webp file as a data URI."""
    def sub(m):
        data = (here / "art" / f"{m.group(1)}.webp").read_bytes()
        return "data:image/webp;base64," + base64.b64encode(data).decode()
    return re.sub(r"\{\{art:([a-z0-9-]+)\}\}", sub, text)

style = inline_art((here / "style.html").read_text())
src   = inline_art((here / "body.html").read_text())
app   = (here / "app.js").read_text()
three = (build / "three.min.js").read_text()

# two invitations from one source: <!--friends-->...<!--/friends--> blocks in
# body.html (the day-before page and its tab) appear only in the friends' one
FRIENDS = re.compile(r"<!--friends-->\n(.*?)<!--/friends-->\n", re.S)
bodies = {"relatives": FRIENDS.sub("", src), "friends": FRIENDS.sub(r"\1", src)}

def tail(invite):
    body = bodies[invite]
    used = sorted(set(re.findall(r'data-art="([a-z0-9-]+)"', body)))
    art  = "var ART={" + ",".join(
        f'"{n}":"data:image/webp;base64,' + base64.b64encode((here / "art" / f"{n}.webp").read_bytes()).decode() + '"'
        for n in used) + "};"
    if invite != "relatives":
        art += f'var INVITE="{invite}";'
    return "\n<script>" + art + "</script>\n<script>" + three + "</script>\n<script>" + app + "</script>\n"

url  = "https://ash-z.github.io/myapp/"
name = "Sai Susmita weds Ashish"
desc = "Thursday, 29 October 2026 · Visakhapatnam. We ask for your presence, and for your blessings."
favicon = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
           "%3Ccircle cx='32' cy='32' r='30' fill='%23F7F2E8'/%3E%3Ccircle cx='32' cy='32' r='21' fill='none' "
           "stroke='%23A97C2B' stroke-width='2.5'/%3E%3Ccircle cx='32' cy='32' r='6' fill='%239A3A32'/%3E%3C/svg%3E")
def head(page_url):
    return f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="{desc}">
<meta name="theme-color" content="#F7F2E8">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta property="og:type" content="website">
<meta property="og:title" content="{name}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{page_url}">
<meta property="og:image" content="{url}og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{favicon}">
"""

# photographs: separate files next to the page on GitHub Pages (loaded as the deck
# needs them); embedded in the artifact, which has to be one file
photos = here / "photos" / "out"
(root / "docs" / "photos").mkdir(exist_ok=True)
for f in photos.glob("*.webp"):
    (root / "docs" / "photos" / f.name).write_bytes(f.read_bytes())
def photo_src(inline, up=""):
    def sub(m):
        n = m.group(1)
        if inline:
            return 'src="data:image/webp;base64,' + base64.b64encode((photos / f"{n}.webp").read_bytes()).decode() + '"'
        return f'src="{up}photos/{n}.webp"'
    return sub
badge = ('<div aria-hidden="true" style="position:fixed;top:calc(env(safe-area-inset-top,0px) + 8px);left:8px;'
         'z-index:9999;pointer-events:none;padding:2px 8px;border-radius:999px;background:#9A3A32;color:#fff;'
         'font:600 10px/16px Karla,system-ui,sans-serif;letter-spacing:.12em">DEV</div>')
for invite, sub in (("relatives", ""), ("friends", "friends/")):
    body, suffix = bodies[invite], "" if invite == "relatives" else "-" + invite
    up = "../" * sub.count("/")
    page = re.sub(r'data-photo="([a-z0-9-]+)"', photo_src(False, up), body)
    one  = re.sub(r'data-photo="([a-z0-9-]+)"', photo_src(True), body)
    (build / f"artifact{suffix}.html").write_text(style + "\n" + one + tail(invite))
    # the dev previews: same pages, marked so they are never mistaken for the ones guests see
    (build / f"artifact-dev{suffix}.html").write_text(
        style.replace(f"<title>{name}</title>", f"<title>{name} (dev{', ' + invite if suffix else ''})</title>")
        + "\n" + badge + "\n" + one + tail(invite))
    (root / "docs" / sub).mkdir(exist_ok=True)
    (root / "docs" / sub / "index.html").write_text(
        '<!doctype html>\n<html lang="en">\n<head>\n' + head(url + sub) + style +
        "\n</head>\n<body>\n" + page + tail(invite) + "</body>\n</html>\n")
print("wrote docs/index.html, docs/friends/index.html and build/artifact{,-dev}{,-friends}.html")
