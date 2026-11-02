const reduceTiles = matchMedia("(prefers-reduced-motion: reduce)").matches;
// ---------- Tile trail + ambient tiles in the page margins ----------
(() => {
  const cv = document.getElementById("tiles"), ctx = cv.getContext("2d");
  const CELL = 22, LIFE = 1100;
  const wrap = document.querySelector(".wrap");
  let tiles = [], dpr = 1, last = "";
  const size = () => {
    dpr = devicePixelRatio || 1;
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size(); addEventListener("resize", size);
  // symbols come in a fixed order (like typing code), colours cycle the same way
  const SEQ = "</>{}=;()[]", PAL = ["#e0803a", "#f2c14e", "#9fd8c4", "#b7a6e8", "#f4a7b9", "#dbe8e3"];
  let n = 0;
  const add = (cx, cy, life = LIFE) => { tiles.push({ cx, cy, born: performance.now(), life, c: PAL[n % PAL.length], g: SEQ[n % SEQ.length] }); n++; };
  // snap to a page-anchored grid so tiles stay put while the page scrolls under them
  const inMargin = x => { const r = wrap.getBoundingClientRect(); return x < r.left || x > r.right; };
  addEventListener("pointermove", e => {
    if (reduceTiles || !inMargin(e.clientX)) return;
    const cx = Math.floor(e.clientX / CELL), cy = Math.floor((e.clientY + scrollY) / CELL), key = cx + "," + cy;
    if (key === last) return;
    // fill the cells between the last one and this one, so fast moves still leave a stepped trail
    const [lx, ly] = last ? last.split(",").map(Number) : [cx, cy];
    const steps = Math.min(8, Math.max(Math.abs(cx - lx), Math.abs(cy - ly)));
    for (let i = 1; i <= steps; i++) {
      const sx = Math.round(lx + (cx - lx) * i / steps), sy = Math.round(ly + (cy - ly) * i / steps);
      if (inMargin(sx * CELL + CELL / 2)) add(sx, sy, i === steps ? LIFE : 750);
    }
    if (!steps) add(cx, cy);
    last = key;
  });
  addEventListener("pointerleave", () => { last = ""; });
  const R = 2; // grid cells revealed around each tile
  const draw = now => {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    tiles = tiles.filter(t => now - t.born < t.life);
    // grid is invisible except a small round patch of cells around live tiles;
    // each cell keeps the strongest reveal so overlapping patches don't darken
    const cells = new Map();
    for (const t of tiles) {
      const age = now - t.born, k = age / t.life;
      const a = k < 0.6 ? Math.min(1, age / 150) : 1 - (k - 0.6) / 0.4;
      for (let dx = -R; dx <= R; dx++) for (let dy = -R; dy <= R; dy++) {
        const d = Math.hypot(dx, dy);
        if (d > R + 0.3) continue;
        const f = a * (1 - d / (R + 0.8)), key = (t.cx + dx) + "," + (t.cy + dy);
        if (f > (cells.get(key) || 0)) cells.set(key, f);
      }
    }
    // each cell draws its top and left edge; right/bottom only where no neighbour will,
    // so shared edges stay a single hairline
    ctx.lineWidth = 1;
    for (const [key, f] of cells) {
      const [cx, cy] = key.split(",").map(Number);
      const x = cx * CELL + .5, y = cy * CELL - scrollY + .5;
      ctx.strokeStyle = `rgba(110,100,88,${(f * 0.45).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(x, y + CELL); ctx.lineTo(x, y); ctx.lineTo(x + CELL, y);
      if (!cells.has((cx + 1) + "," + cy)) { ctx.moveTo(x + CELL, y); ctx.lineTo(x + CELL, y + CELL); }
      if (!cells.has(cx + "," + (cy + 1))) { ctx.moveTo(x, y + CELL); ctx.lineTo(x + CELL, y + CELL); }
      ctx.stroke();
    }
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "600 9px 'JetBrains Mono', monospace";
    for (const t of tiles) {
      const age = now - t.born, k = age / t.life;
      const x = t.cx * CELL, y = t.cy * CELL - scrollY;
      if (y < -CELL || y > innerHeight) continue;
      // pop: overshoot to ~1.25x in 260ms and settle, then shrink slightly as it fades
      const p = Math.min(1, age / 260);
      const back = 1 + 2.7 * Math.pow(p - 1, 3) + 1.7 * Math.pow(p - 1, 2);
      const s = p < 1 ? back : 1 - Math.max(0, k - 0.6) * 0.5;
      const a = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
      // inset like a key in its slot, so the grid line stays visible around it
      const cx = x + CELL / 2, cy = y + CELL / 2, h = (CELL - 6) * s / 2;
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.roundRect(cx - h, cy - h, h * 2, h * 2, 3 * s);
      ctx.fillStyle = t.c; ctx.fill();
      ctx.strokeStyle = "rgba(28,25,23,.28)"; ctx.lineWidth = 1; ctx.stroke();
      ctx.save(); ctx.translate(cx, cy + 1); ctx.scale(s, s);
      ctx.fillStyle = "#1c1917"; ctx.fillText(t.g, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
})();
