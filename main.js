gsap.registerPlugin(ScrollTrigger);

// ---------- Intro loader: holds the page 2.5s while images and fonts preload ----------
// Full 2.5s on the first visit; a short one when coming back (e.g. from a mockup) in the same session
let seenLoader = false;
try { seenLoader = sessionStorage.getItem("seenLoader") === "1"; sessionStorage.setItem("seenLoader", "1"); } catch (e) {}
const LOADER_MS = seenLoader ? 500 : 2500;
const loaderEl = document.getElementById("loader");
const loaderBar = loaderEl.querySelector(".loader-bar i");
const loaderPct = document.getElementById("loader-pct");
history.scrollRestoration = "manual";
scrollTo(0, 0);
const loaderStart = performance.now();
const lcv = document.getElementById("loader-cv"), lctx = lcv.getContext("2d");
const CELL = 14;
let lw = 0, lh = 0;
const lsize = () => { lw = lcv.width = innerWidth; lh = lcv.height = innerHeight; };
lsize(); addEventListener("resize", lsize);
// two inks, each with its own "heat" centre and a few px of misregistration
const INKS = [
  { col: "#e0803a", cx: .38, cy: .46, ox: 0, oy: 0, dx: 0, dy: 0 },
  { col: "#f2c14e", cx: .66, cy: .58, ox: 7, oy: 7, dx: 3, dy: 2 }
];
const ease = t => t * t * (3 - 2 * t);
const drawLoader = p => {
  lctx.clearRect(0, 0, lw, lh);
  const diag = Math.hypot(lw, lh), maxR = CELL * .56;
  for (const ink of INKS) {
    lctx.fillStyle = ink.col;
    lctx.beginPath();
    const cx = ink.cx * lw, cy = ink.cy * lh;
    for (let y = ink.oy; y < lh + CELL; y += CELL) for (let x = ink.ox; x < lw + CELL; x += CELL) {
      const f = 1 - Math.hypot(x - cx, y - cy) / (diag * .62);        // 1 at the hot core, falls away
      const r = maxR * Math.max(0, Math.min(1, (ease(p) * 1.15 - (1 - f)) * 1.8));
      if (r < .6) continue;
      lctx.moveTo(x + ink.dx + r, y + ink.dy);
      lctx.arc(x + ink.dx, y + ink.dy, r, 0, 6.2832);
    }
    lctx.fill();
  }
};
const loaderTick = now => {
  const p = Math.min(1, (now - loaderStart) / LOADER_MS);
  loaderBar.style.transform = `scaleX(${p})`;
  loaderPct.textContent = Math.round(p * 100) + "%";
  drawLoader(p);
  if (p < 1) requestAnimationFrame(loaderTick);
};
requestAnimationFrame(loaderTick);
const imagesReady = Promise.all([...document.images].map(img => {
  img.loading = "eager";
  return (img.complete ? Promise.resolve() : new Promise(r => { img.onload = img.onerror = r; }))
    .then(() => img.decode ? img.decode().catch(() => {}) : 0);
}));
const loaderDone = Promise.all([new Promise(r => setTimeout(r, LOADER_MS)), imagesReady, document.fonts.ready]);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GLYPHS = "&=+*#%$@<>/\\{}[]()?!~^;:";
const COLORS = ["#e0803a", "#f2c14e", "#2f5d50", "#dbe8e3", "#f4a7b9", "#b7a6e8", "#9fd8c4"];
const pick = s => s[Math.floor(Math.random() * s.length)];


// ---------- Clock in the top strip ----------
const clock = document.getElementById("clock");
const tick = () => { clock.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false }); };
if (clock) { tick(); setInterval(tick, 1000); }

// ---------- Scramble: text flickers through random symbols, then settles ----------
function scramble(el, duration = 700) {
  if (reduce || el._busy) return;
  // only touch plain text nodes, so nested spans (the accent dot) keep their styling
  const nodes = [];
  const walk = n => n.nodeType === 3 ? n.textContent.trim() && nodes.push(n) : n.childNodes.forEach(walk);
  walk(el);
  const originals = nodes.map(n => n.textContent);
  const start = performance.now();
  el._busy = true;
  const frame = now => {
    const t = Math.min(1, (now - start) / duration);
    nodes.forEach((n, k) => {
      const src = originals[k];
      const done = Math.floor(src.length * t);
      n.textContent = src.slice(0, done) + [...src.slice(done)].map(c => c === " " ? " " : pick(GLYPHS)).join("");
    });
    if (t < 1) requestAnimationFrame(frame);
    else { nodes.forEach((n, k) => n.textContent = originals[k]); el._busy = false; }
  };
  requestAnimationFrame(frame);
}
document.querySelectorAll("[data-scramble]").forEach(el => {
  const target = el.closest("a") || el;
  target.addEventListener("mouseenter", () => scramble(el, 450));
});
// Header is there from the start; its labels decode once the fonts are in
const header = document.querySelector(".header");
const showHeader = () => {
  header.classList.add("show");
  header.querySelectorAll("[data-scramble]").forEach((el, i) => setTimeout(() => scramble(el, 600), 150 + i * 80));
};


// ---------- Photo slots stay hidden until the photo file actually exists ----------
document.querySelectorAll(".photo-slot").forEach(slot => {
  const img = new Image();
  img.alt = "";
  img.onload = () => { slot.append(img); slot.classList.add("has"); ScrollTrigger.refresh(); };
  img.src = slot.dataset.src;
});

// ---------- Research art: little candlestick chart drawn from a seeded random walk ----------
(() => {
  const g = document.querySelector(".candles");
  let seed = 7, p = 120, s = "";
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 40; i++) {
    const o = p, c = Math.max(20, Math.min(180, p + (rnd() - 0.48) * 26));
    const hi = Math.min(o, c) - rnd() * 12, lo = Math.max(o, c) + rnd() * 12, x = 6 + i * 9.8;
    const col = c < o ? "#f2c14e" : "#e0803a";
    s += `<line x1="${x}" x2="${x}" y1="${hi}" y2="${lo}" stroke="${col}" stroke-width="1"/>` +
         `<rect x="${x - 3}" y="${Math.min(o, c)}" width="6" height="${Math.max(2, Math.abs(c - o))}" fill="${col}"/>`;
    p = c;
  }
  g.innerHTML = s;
})();

const revealSite = () => {
  loaderEl.classList.add("done");
  document.body.classList.remove("loading");
  ScrollTrigger.refresh();
  showHeader();
  // the loader holds the page at the top, so jump to #section links (like "Back to portfolio") once it's gone
  const target = location.hash && document.querySelector(location.hash);
  if (target) requestAnimationFrame(() => scrollTo(0, target.getBoundingClientRect().top + scrollY - 104));
};
document.fonts.ready.then(() => {
  loaderDone.then(revealSite);
  if (reduce) return;

  // Reading progress line under the nav
  gsap.to(".progress-bar", { scaleX: 1, ease: "none", scrollTrigger: { trigger: "body", start: "top top", end: "bottom bottom", scrub: 0.3 } });

  // Wordmark: letters spring up one by one, then lean with scroll speed
  const wm = document.querySelector(".wordmark");
  [...wm.childNodes].forEach(node => {
    if (node.nodeType !== 3) { node.classList.add("ch"); return; }
    const frag = document.createDocumentFragment();
    [...node.textContent].forEach(c => {
      if (c === " ") { frag.append(" "); return; }
      const s = document.createElement("span"); s.className = "ch"; s.textContent = c; frag.append(s);
    });
    node.replaceWith(frag);
  });
  const chars = wm.querySelectorAll(".ch");
  gsap.from(chars, { yPercent: 120, rotate: 12, opacity: 0, stagger: 0.035, duration: 0.9, ease: "back.out(1.8)",
    scrollTrigger: { trigger: wm, start: "top 85%" }, onComplete: () => scramble(wm, 700) });
  const skew = gsap.quickTo(chars, "skewX", { duration: 0.5, ease: "power3" });
  ScrollTrigger.create({ trigger: ".mark-sec", start: "top bottom", end: "bottom top",
    onUpdate: s => { skew(gsap.utils.clamp(-14, 14, s.getVelocity() / -120)); clearTimeout(wm._t); wm._t = setTimeout(() => skew(0), 120); } });
  gsap.from(".mark-sec .grid2 .cell", { y: 60, opacity: 0, stagger: 0.15, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: ".mark-sec .grid2", start: "top 88%" } });
  gsap.from(".steps li", { y: 40, opacity: 0, stagger: 0.03, duration: 0.25, ease: "power3.out",
    scrollTrigger: { trigger: ".steps", start: "top 85%" } });

  // Slash headings: decode, the slash drops in with a bounce, the hairline under them draws across
  gsap.utils.toArray(".sec-head").forEach(h => {
    ScrollTrigger.create({ trigger: h, start: "top 85%", once: true, onEnter: () => scramble(h, 650) });
    gsap.from(h.querySelector("i"), { y: -80, rotate: -40, opacity: 0, duration: 0.9, ease: "bounce.out", scrollTrigger: { trigger: h, start: "top 85%" } });
    gsap.fromTo(h, { "--draw": 0 }, { "--draw": 1, ease: "none", scrollTrigger: { trigger: h, start: "top 90%", end: "top 40%", scrub: true } });
  });

  // River rows: the image cell wipes open, the text cell follows
  gsap.utils.toArray(".river .grid2").forEach(row => {
    const media = row.querySelector(".media, .paper-art");
    const fromLeft = row.firstElementChild === media;
    gsap.fromTo(media, { clipPath: fromLeft ? "inset(0 100% 0 0)" : "inset(0 0 0 100%)" }, { clipPath: "inset(0 0% 0 0%)", ease: "none",
      scrollTrigger: { trigger: row, start: "top 85%", end: "top 30%", scrub: true } });
  });
  gsap.from(".candles > *", { scaleY: 0, transformOrigin: "50% 50%", stagger: 0.015, ease: "back.out(2)", duration: 0.5,
    scrollTrigger: { trigger: ".paper-art", start: "top 70%" } });
  gsap.from(".tags li", { y: 30, scale: 0.5, opacity: 0, stagger: 0.07, ease: "back.out(2.5)", duration: 0.6,
    scrollTrigger: { trigger: ".tags", start: "top 92%" } });
  gsap.from(".paper-title", { yPercent: 40, opacity: 0, duration: 1, ease: "power4.out", stagger: 0.2,
    scrollTrigger: { trigger: ".paper-title", start: "top 90%" } });

  // Tool rows: endless full-width marquee, opposite directions, pushed by scroll speed
  if (!reduce) document.querySelectorAll(".river-tools .row").forEach((row, n) => {
    const set = [...row.children], dir = n % 2 ? 1 : -1, speed = 70;
    let guard = 0;
    set.forEach(el => row.appendChild(el.cloneNode(true)));
    const w0 = row.children[set.length].offsetLeft - row.children[0].offsetLeft;
    while (row.scrollWidth < w0 + innerWidth * 1.5 && guard++ < 6) set.forEach(el => row.appendChild(el.cloneNode(true)));
    const tw = gsap.fromTo(row, { x: dir < 0 ? 0 : -w0 }, { x: dir < 0 ? -w0 : 0, ease: "none", duration: w0 / speed, repeat: -1 });
    ScrollTrigger.create({ trigger: ".river-tools", start: "top bottom", end: "bottom top", onUpdate: self => {
      const boost = 1 + Math.min(Math.abs(self.getVelocity()) / 300, 8);
      gsap.to(tw, { timeScale: boost * (self.direction < 0 ? -1 : 1) * 1, duration: 0.2, overwrite: true,
        onComplete: () => gsap.to(tw, { timeScale: 1, duration: 1.2, ease: "power2.out" }) });
    } });
  });

  // Work: vertical scroll moves the cards sideways
  const track = document.querySelector(".track");
  const wrapW = () => document.querySelector(".wrap").clientWidth;
  const slide = gsap.to(track, {
    x: () => -(track.scrollWidth - wrapW()),
    ease: "none",
    scrollTrigger: {
      trigger: ".tries", start: "top 104px", end: () => "+=" + (track.scrollWidth - wrapW()),
      pin: true, scrub: 1, invalidateOnRefresh: true
    }
  });
  gsap.utils.toArray(".card").forEach(c => gsap.from(c, {
    y: 40, opacity: 0.4,
    scrollTrigger: { trigger: c, containerAnimation: slide, start: "left 95%", end: "left 60%", scrub: true }
  }));

  // Certificates: pinned; they start as a messy pile in the middle and deal out into the grid
  const certs = gsap.utils.toArray(".cert");
  const grid = document.querySelector(".cert-grid");
  if (innerWidth > 1000) {
    // offsetLeft ignores transforms, so re-measuring on resize never drifts
    const toCenter = el => grid.offsetLeft + grid.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
    const toMiddle = el => grid.offsetTop + grid.clientHeight / 2 - (el.offsetTop + el.offsetHeight / 2);
    const tilt = [-9, 5, -3, 8, -6, 4, -7, 2];
    gsap.timeline({ scrollTrigger: { trigger: ".certs", start: "top 104px", end: "+=1100", pin: true, scrub: 1, invalidateOnRefresh: true } })
      .fromTo(certs, { x: i => toCenter(certs[i]), y: i => toMiddle(certs[i]) + i * -10 + 40, rotate: i => tilt[i % tilt.length], scale: 0.85 },
        { x: 0, y: 0, rotate: 0, scale: 1, stagger: 0.1, ease: "power2.inOut" })
      .from(".cert-n, .cert-t, .ok", { opacity: 0, y: 12, stagger: 0.03 }, ">-0.2");
  } else {
    certs.forEach(el => gsap.from(el, { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
  }

  // Hover physics: cards tilt toward the pointer, buttons get pulled toward it
  document.querySelectorAll(".card, .cert, .mock").forEach(el => {
    const rx = gsap.quickTo(el, "rotationX", { duration: 0.5, ease: "power3" });
    const ry = gsap.quickTo(el, "rotationY", { duration: 0.5, ease: "power3" });
    gsap.set(el, { transformPerspective: 900 });
    el.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      ry(((e.clientX - r.left) / r.width - 0.5) * 10); rx(((e.clientY - r.top) / r.height - 0.5) * -10);
    });
    el.addEventListener("pointerleave", () => { rx(0); ry(0); });
  });
  document.querySelectorAll(".btn-primary, .go, .nav .cta, .ok").forEach(el => {
    el.classList.add("magnet");
    const mx = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3" }), my = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3" });
    const host = el.closest("a") || el;
    host.addEventListener("pointermove", e => {
      const r = el.getBoundingClientRect();
      mx((e.clientX - (r.left + r.width / 2)) * 0.25); my((e.clientY - (r.top + r.height / 2)) * 0.25);
    });
    host.addEventListener("pointerleave", () => { mx(0); my(0); });
  });

  // Footer wordmark decodes
  ScrollTrigger.create({ trigger: ".foot-mark", start: "top 90%", once: true, onEnter: e => scramble(e.trigger, 1000) });
});
