// Builds one static proposal page per business.
//   node proposals/build.mjs            -> builds every proposals/data/*.json
//   node proposals/build.mjs the-fern   -> builds proposals/data/the-fern.json only
// Output: proposals/<slug>/index.html, shared at https://gedon111.github.io/portfolio/proposals/<slug>/
// Static pages (not one page reading ?for=) so each link preview in Messenger shows that business's name.
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://gedon111.github.io/portfolio";
// One place for contact details. Add a Messenger link here when you have it, e.g. "https://m.me/yourname".
const CONTACT = {
  phone: "0993 878 5779",
  tel: "+639938785779",
  email: "charlesgideon319@gmail.com",
  messenger: "",
};

const here = dirname(fileURLToPath(import.meta.url));
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const peso = n => "₱" + Number(n).toLocaleString("en-PH");
const longDate = d => d.toLocaleDateString("en-PH", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Manila" });

function page(p) {
  const prepared = new Date(p.prepared + "T00:00:00+08:00");
  const valid = new Date(prepared.getTime() + (p.validDays ?? 30) * 864e5);
  const title = `Proposal for ${p.business}`;
  const desc = `A website plan for ${p.business}${p.place ? ", " + p.place : ""}: what's included, the monthly price and the terms.`;
  const img = p.sample?.image ? `${SITE}/${p.sample.image}` : `${SITE}/images/og-image.png`;
  const sms = `sms:${CONTACT.tel}?body=${encodeURIComponent(`OK, ${p.business}`)}`;

  const plans = (p.plans ?? []).map(pl => `
      <article class="plan${pl.recommended ? " rec" : ""}">
        ${pl.recommended ? '<span class="rec-tag">Recommended</span>' : ""}
        <h3>${esc(pl.name)}</h3>
        <p class="price"><b>${peso(pl.price)}</b><span>a month</span></p>
        <ul>${pl.includes.map(i => `<li>${esc(i)}</li>`).join("")}</ul>
      </article>`).join("");

  const contactLinks = [
    `<a class="cl main" href="${sms}"><b>Text "OK"</b>${CONTACT.phone}</a>`,
    `<a class="cl" href="viber://chat?number=${encodeURIComponent(CONTACT.tel)}"><b>Viber</b>${CONTACT.phone}</a>`,
    `<a class="cl" href="tel:${CONTACT.tel}"><b>Call</b>${CONTACT.phone}</a>`,
    CONTACT.messenger && `<a class="cl" href="${esc(CONTACT.messenger)}" target="_blank" rel="noopener"><b>Messenger</b>Send a message</a>`,
    `<a class="cl" href="mailto:${CONTACT.email}?subject=${encodeURIComponent(title)}"><b>Email</b>${CONTACT.email}</a>`,
  ].filter(Boolean).join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="${esc(desc)}">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}/proposals/${esc(p.slug)}/">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600&display=swap">
<link rel="stylesheet" href="../proposal.css">
</head>
<body>
<main class="doc">
  <header class="top">
    <a class="from" href="${SITE}/">cgp<i>/</i> Gideon Pasok, web developer</a>
    <h1>${esc(title)}</h1>
    <dl class="meta">
      ${p.owner ? `<div><dt>For</dt><dd>${esc(p.owner)}</dd></div>` : ""}
      ${p.place ? `<div><dt>Where</dt><dd>${esc(p.place)}</dd></div>` : ""}
      <div><dt>Prepared</dt><dd>${longDate(prepared)}</dd></div>
      <div><dt>Valid until</dt><dd>${longDate(valid)}</dd></div>
    </dl>
  </header>

  ${p.noticed?.length ? `<section>
    <h2>What I noticed</h2>
    <ul class="noticed">${p.noticed.map(n => `<li>${esc(n)}</li>`).join("")}</ul>
  </section>` : ""}

  ${p.sample?.url ? `<section>
    <h2>Your sample page</h2>
    <a class="sample" href="${esc(p.sample.url)}" target="_blank" rel="noopener"><span>Open the sample page</span><span aria-hidden="true">↗</span></a>
    ${p.sample.note ? `<p class="fine">${esc(p.sample.note)}</p>` : ""}
  </section>` : ""}

  <section>
    <h2>Plans</h2>
    <div class="plans">${plans}</div>
    ${p.notIncluded?.length ? `<h3 class="sub">Not included</h3><ul class="plain">${p.notIncluded.map(n => `<li>${esc(n)}</li>`).join("")}</ul>` : ""}
  </section>

  ${p.terms?.length ? `<section>
    <h2>Terms</h2>
    <dl class="terms">${p.terms.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join("")}</dl>
  </section>` : ""}

  ${p.faq?.length ? `<section>
    <h2>Questions you might have</h2>
    ${p.faq.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}
  </section>` : ""}

  <section class="next">
    <h2>Next step</h2>
    <p class="next-line">${esc(p.nextStep ?? "Message me and I'll start building your site.")}</p>
    <div class="contact">${contactLinks}</div>
  </section>

  <footer class="foot"><a href="${SITE}/">See my other work</a><span>Prices in Philippine pesos. This proposal is valid until ${longDate(valid)}.</span></footer>
</main>
</body>
</html>
`;
}

const dataDir = join(here, "data");
const only = process.argv[2];
const files = readdirSync(dataDir).filter(f => f.endsWith(".json") && (!only || f === only + ".json"));
if (!files.length) { console.error(only ? `No proposals/data/${only}.json` : "No proposal data files"); process.exit(1); }
for (const f of files) {
  const p = JSON.parse(readFileSync(join(dataDir, f), "utf8"));
  p.slug ??= f.replace(/\.json$/, "");
  for (const k of ["business", "prepared", "plans"]) if (!p[k]) throw new Error(`${f}: missing "${k}"`);
  const out = join(here, p.slug);
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "index.html"), page(p));
  console.log(`built proposals/${p.slug}/  ->  ${SITE}/proposals/${p.slug}/`);
}
