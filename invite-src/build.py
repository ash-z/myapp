"""Assemble the invitation into one self-contained page.

    cd invite-src && npm install && python3 build.py

Writes docs/index.html (served by GitHub Pages) and build/artifact.html
(the same page without <head>, for publishing as a Claude artifact).
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
body  = inline_art((here / "body.html").read_text())
app   = (here / "app.js").read_text()
three = (build / "three.min.js").read_text()
used  = sorted(set(re.findall(r'data-art="([a-z0-9-]+)"', body)))
art   = "var ART={" + ",".join(
    f'"{n}":"data:image/webp;base64,' + base64.b64encode((here / "art" / f"{n}.webp").read_bytes()).decode() + '"'
    for n in used) + "};"
tail  = "\n<script>" + art + "</script>\n<script>" + three + "</script>\n<script>" + app + "</script>\n"

url  = "https://ash-z.github.io/myapp/"
name = "Sai Susmita weds Ashish"
desc = "Thursday, 29 October 2026 · Visakhapatnam. We ask for your presence, and for your blessings."
favicon = ("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E"
           "%3Ccircle cx='32' cy='32' r='30' fill='%23F7F2E8'/%3E%3Ccircle cx='32' cy='32' r='21' fill='none' "
           "stroke='%23A97C2B' stroke-width='2.5'/%3E%3Ccircle cx='32' cy='32' r='6' fill='%239A3A32'/%3E%3C/svg%3E")
head = f"""<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="description" content="{desc}">
<meta name="theme-color" content="#F7F2E8">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta property="og:type" content="website">
<meta property="og:title" content="{name}">
<meta property="og:description" content="{desc}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{url}og.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="{favicon}">
"""

(build / "artifact.html").write_text(style + "\n" + body + tail)
(root / "docs" / "index.html").write_text(
    '<!doctype html>\n<html lang="en">\n<head>\n' + head + style +
    "\n</head>\n<body>\n" + body + tail + "</body>\n</html>\n")
print("wrote docs/index.html and build/artifact.html")
