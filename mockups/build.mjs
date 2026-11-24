// Builds one-page business mockups from JSON.
//   node mockups/build.mjs            -> every mockups/data/*.json
//   node mockups/build.mjs the-fern   -> one
// Output: mockups/<slug>/index.html (photos go in mockups/<slug>/photos/, referenced as "photos/name.jpg").
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://gedon111.github.io/portfolio";
const here = dirname(fileURLToPath(import.meta.url));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const shade = (hex, f) => "#" + hex.slice(1).match(/../g).map(h => Math.round(Math.min(255, Math.max(0, parseInt(h, 16) * f))).toString(16).padStart(2, "0")).join("");
const inkOn = hex => { const [r, g, b] = hex.slice(1).match(/../g).map(h => parseInt(h, 16)); return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#1c1917" : "#fff"; };

// Two bases + one accent per type (Anti-Flat rule). Override any of them with "colors" in the JSON.
const PRESETS = {
  food:     { c1: "#8a3b12", c2: "#fbf1de", acc: "#f2c14e", paper: "#efe6d2", ink: "#2a2118", display: "Fraunces", body: "Inter" },
  resort:   { c1: "#1f5f55", c2: "#f4f0e2", acc: "#ff8a3d", paper: "#e9e4d2", ink: "#1f2a26", display: "Fraunces", body: "Inter" },
  services: { c1: "#1d3f73", c2: "#f3f1ea", acc: "#ffb347", paper: "#e8e6dd", ink: "#1b2230", display: "Space Grotesk", body: "Inter" },
};

function page(d) {
  const c = { ...(PRESETS[d.type] ?? PRESETS.services), ...(d.colors ?? {}) };
  const title = `${d.business}${d.place ? " · " + d.place : ""}`;
  const desc = `Sample website for ${d.business}${d.place ? ", " + d.place : ""}, made by Gideon Pasok.`;
  const fonts = [...new Set([c.display, c.body])].map(f => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&");
  const tel = d.phone ? String(d.phone).replace(/[^\d+]/g, "") : "";
  const cta = d.cta?.href ? d.cta : d.facebook ? { label: "Message us", href: d.facebook } : tel ? { label: "Call us", href: `tel:${tel}` } : null;
  const style = `--c1:${c.c1};--c1b:${shade(c.c1, 1.45)};--c1d:${shade(c.c1, .6)};--c2:${c.c2};--acc:${c.acc};--acc-ink:${inkOn(c.acc)};--paper:${c.paper};--panel:${shade(c.paper, 1.05)};--ink:${c.ink};--display:'${c.display}',Georgia,serif;--body:'${c.body}',system-ui,sans-serif`;
  const offersTitle = d.offers?.title ?? "Rates";
  const offers = d.offers?.items?.length ? `<section id="offers"><div class="wrap"><h2>${esc(offersTitle)}</h2>
    <ul class="offers">${d.offers.items.map(i => `<li><b>${esc(i.name)}</b>${i.detail ? `<span>${esc(i.detail)}</span>` : ""}${i.price ? `<span class="price">${esc(i.price)}</span>` : ""}</li>`).join("")}</ul></div></section>` : "";
  const hours = d.hours?.length ? `<div class="panel"><h2>Hours</h2><dl class="hours">${d.hours.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl></div>` : "";
  const where = (d.address || d.mapUrl || tel || d.facebook) ? `<div class="panel where"><h2>Find us</h2>
    ${d.address ? `<p>${esc(d.address)}</p>` : ""}
    ${d.mapUrl ? `<p><a href="${esc(d.mapUrl)}" target="_blank" rel="noopener">Open in Google Maps</a></p>` : ""}
    ${tel ? `<p><a href="tel:${tel}">${esc(d.phone)}</a></p>` : ""}
    ${d.facebook ? `<p><a href="${esc(d.facebook)}" target="_blank" rel="noopener">Facebook page</a></p>` : ""}</div>` : "";
  const shots = d.photos?.length ? `<section id="photos"><div class="wrap"><h2>Photos</h2><div class="shots">${d.photos.map(p => `<img src="${esc(p.src)}" alt="${esc(p.alt ?? "")}" loading="lazy">`).join("")}</div></div></section>` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/mockups/${esc(d.slug)}/">
<meta property="og:image" content="${SITE}/images/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap">
<link rel="stylesheet" href="../template.css">
<link rel="stylesheet" href="../portfolio-back.css">
</head>
<body style="${esc(style)}">
<a class="pf-back" href="../../index.html#mockups" aria-label="Back to Gideon's portfolio"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5m6-6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg><span><b>cgp/</b> Back to portfolio</span></a>
<div class="note">Sample page made for ${esc(d.business)} by <a href="${SITE}/">Gideon Pasok</a>. Sample details get replaced with yours.</div>
<header class="hero"><div class="wrap">
  ${d.place ? `<p class="place">${esc(d.place)}</p>` : ""}
  <h1>${esc(d.business)}</h1>
  <p class="tag">${esc(d.tagline ?? "")}</p>
  <div class="btns">${cta ? `<a class="btn" href="${esc(cta.href)}"${cta.href.startsWith("http") ? ' target="_blank" rel="noopener"' : ""}>${esc(cta.label)}</a>` : ""}${d.offers?.items?.length ? `<a class="link" href="#offers">${esc(offersTitle)}</a>` : ""}</div>
</div></header>
<main>
  ${d.about ? `<section><div class="wrap"><p class="about">${esc(d.about)}</p></div></section>` : ""}
  ${offers}
  ${(hours || where) ? `<section><div class="wrap cols">${hours}${where}</div></section>` : ""}
  ${shots}
</main>
<footer class="foot"><div class="wrap">Sample website by <a href="${SITE}/">Gideon Pasok</a>, Magalang, Pampanga.</div></footer>
</body>
</html>
`;
}

const dataDir = join(here, "data");
const only = process.argv[2];
const files = readdirSync(dataDir).filter(f => f.endsWith(".json") && (!only || f === only + ".json"));
if (!files.length) { console.error(only ? `No mockups/data/${only}.json` : "No mockup data files"); process.exit(1); }
for (const f of files) {
  const d = JSON.parse(readFileSync(join(dataDir, f), "utf8"));
  d.slug ??= f.replace(/\.json$/, "");
  if (!d.business) throw new Error(`${f}: missing "business"`);
  const out = join(here, d.slug);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "index.html"), page(d));
  console.log(`built mockups/${d.slug}/  ->  ${SITE}/mockups/${d.slug}/`);
}
