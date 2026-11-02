gsap.registerPlugin(ScrollTrigger);

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const GLYPHS = "&=+*#%$@<>/\\{}[]()?!~^;:";
const COLORS = ["#e0803a", "#f2c14e", "#2f5d50", "#dbe8e3", "#f4a7b9", "#b7a6e8", "#9fd8c4"];
const pick = s => s[Math.floor(Math.random() * s.length)];

// ---------- Clock in the top strip ----------
const clock = document.getElementById("clock");
const tick = () => { clock.textContent = new Date().toLocaleTimeString("en-GB", { hour12: false }); };
tick(); setInterval(tick, 1000);

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
// Header stays hidden over the hello hero, then drops in (and decodes) once the wordmark arrives
// (created after the hero pin so its start accounts for the pinned scroll distance)
const header = document.querySelector(".header");
const watchHeader = () => ScrollTrigger.create({
  trigger: ".mark-sec", start: "top 70%",
  onEnter: () => {
    header.classList.add("show");
    header.querySelectorAll("[data-scramble]").forEach((el, i) => setTimeout(() => scramble(el, 600), 150 + i * 80));
  },
  onLeaveBack: () => header.classList.remove("show")
});


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

document.fonts.ready.then(() => {
  if (reduce) {
    gsap.set("#hello", { fillOpacity: 1 });
    gsap.set("#pen", { attr: { width: 1000 } });
    watchHeader();
    return;
  }

  const skip = document.documentElement.classList.contains("skip-intro");
  if (!skip) {
    // Hello: a pen sweeps left to right revealing the outline, then the ink fills in
    gsap.timeline({ delay: 0.3 })
      .to("#pen", { attr: { width: 1000 }, duration: 2.4, ease: "power2.inOut" })
      .to("#hello", { fillOpacity: 1, duration: 0.8, ease: "power1.out" }, "-=0.8");

    // Then scroll takes over: pinned hero cycles greetings, each with its own backdrop
    const greets = gsap.utils.toArray(".greet");
    const bgs = gsap.utils.toArray(".bg");
    const tl = gsap.timeline({
      scrollTrigger: { trigger: ".hero", start: "top top", end: "+=3000", pin: true, scrub: 1 }
    });
    tl.to(".scroll-hint", { opacity: 0, duration: 0.3 })
      .to(".hello-svg", { scale: 0.85, opacity: 0, filter: "blur(12px)", duration: 1 }, 0);
    greets.forEach((g, i) => {
      tl.fromTo(g, { opacity: 0, y: 60, filter: "blur(10px)" },
                   { opacity: 1, y: 0, filter: "blur(0px)", duration: 1 }, i === 0 ? 0.6 : ">-0.2")
        .fromTo(bgs[i + 1], { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 1.4 }, "<")
        .to(bgs[i], { opacity: 0, duration: 1 }, "<")
        .to(g, { opacity: 0, y: -60, filter: "blur(10px)", duration: 1 }, ">-0.2");
    });
    tl.to({}, { duration: 0.6 });
  }
  if (skip) header.classList.add("show");
  watchHeader();

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
  gsap.from(".intro-icons > *", { y: 30, scale: 0.4, opacity: 0, stagger: 0.08, duration: 0.6, ease: "back.out(2.5)",
    scrollTrigger: { trigger: ".intro-icons", start: "top 90%" } });

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
  gsap.from(".hw-title, .paper-title", { yPercent: 40, opacity: 0, duration: 1, ease: "power4.out", stagger: 0.2,
    scrollTrigger: { trigger: ".hw-title", start: "top 90%" } });

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

  gsap.fromTo(".hw .shot", { y: 40, rotate: -2 }, { y: -40, rotate: 1, ease: "none",
    scrollTrigger: { trigger: ".hw", start: "top bottom", end: "bottom top", scrub: true } });

  // Certificates: pinned; they start as a messy pile in the middle and deal out into the grid
  const certs = gsap.utils.toArray(".cert");
  const grid = document.querySelector(".cert-grid");
  if (innerWidth > 1000) {
    // offsetLeft ignores transforms, so re-measuring on resize never drifts
    const toCenter = el => grid.offsetLeft + grid.clientWidth / 2 - (el.offsetLeft + el.offsetWidth / 2);
    gsap.timeline({ scrollTrigger: { trigger: ".certs", start: "top 104px", end: "+=900", pin: true, scrub: 1, invalidateOnRefresh: true } })
      .fromTo(certs, { x: i => toCenter(certs[i]), y: i => i * -10 + 40, rotate: i => [-9, 5, -3, 8, -6][i], scale: 0.85 },
        { x: 0, y: 0, rotate: 0, scale: 1, stagger: 0.12, ease: "power2.inOut" })
      .from(".cert-n, .cert-t, .ok", { opacity: 0, y: 12, stagger: 0.03 }, ">-0.2");
  } else {
    certs.forEach(el => gsap.from(el, { y: 60, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } }));
  }

  // Hover physics: cards tilt toward the pointer, buttons get pulled toward it
  document.querySelectorAll(".card, .cert").forEach(el => {
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
