// Kintab Auto Studio: concept mockup. No data leaves the page.
document.documentElement.classList.remove("no-js");

const PKGS = [
  { id: "wash", name: "Signature Wash", time: "1 to 1.5 hrs", star: false,
    items: ["Foam pre-soak", "Two-bucket hand wash", "Wheel and tyre detail", "Spray sealant"],
    price: { sedan: 650, suv: 850, van: 1050 } },
  { id: "interior", name: "Interior Reset", time: "3 to 4 hrs", star: false,
    items: ["Vacuum and steam", "Seat shampoo or leather care", "Dashboard and vents", "Odour treatment"],
    price: { sedan: 2800, suv: 3500, van: 4200 } },
  { id: "correction", name: "Paint Correction", time: "1 to 2 days", star: false,
    items: ["Decon wash and clay", "Two-stage machine polish", "Removes 80 to 90% of swirls", "Panel wipe"],
    price: { sedan: 12000, suv: 15000, van: 18000 } },
  { id: "ceramic", name: "Ceramic Coating", time: "2 days", star: true,
    items: ["One-stage polish included", "9H coating, 3-year rated", "Wheels and glass coated", "Free 1-month check"],
    price: { sedan: 25000, suv: 30000, van: 35000 } },
  { id: "ppf", name: "Paint Protection Film", time: "3 to 4 days", star: false,
    items: ["Full front: hood, fenders, bumper", "Self-healing film", "Edges wrapped", "7-year film warranty"],
    price: { sedan: 45000, suv: 55000, van: 62000 } },
];
const SIZES = { sedan: "Sedan / Hatchback", suv: "SUV / Pickup", van: "Van / MPV" };
const peso = n => "₱" + n.toLocaleString("en-PH");

// mobile menu
const burger = document.querySelector(".burger"), menu = document.querySelector(".menu");
if (burger) burger.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  burger.setAttribute("aria-expanded", open);
});

// reveal on scroll with a stagger inside each group
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { rootMargin: "0px 0px -8% 0px" }) : null;
function watch(root = document) {
  root.querySelectorAll("[data-stagger]").forEach(g => [...g.children].forEach((c, i) => { c.classList.add("rv"); c.style.setProperty("--i", i); }));
  root.querySelectorAll(".rv:not(.in)").forEach(el => io ? io.observe(el) : el.classList.add("in"));
}

// scatter water beads randomly so the "after" panel doesn't read as a tiled pattern
const field = document.getElementById("beadfield");
if (field) {
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const ns = "http://www.w3.org/2000/svg", fill = field.dataset.fill;
  field.innerHTML = "";
  for (let n = 0; n < 170; n++) {
    const c = document.createElementNS(ns, "circle"), big = rnd() < .18;
    c.setAttribute("cx", (rnd() * 1200).toFixed(1));
    c.setAttribute("cy", (rnd() * 322).toFixed(1));
    c.setAttribute("r", (big ? 6 + rnd() * 6 : 1.5 + rnd() * 3.5).toFixed(1));
    c.setAttribute("fill", fill);
    field.appendChild(c);
  }
}

// before / after slider
document.querySelectorAll(".ba").forEach(ba => {
  const r = ba.querySelector("input");
  const set = () => ba.style.setProperty("--cut", r.value + "%");
  r.addEventListener("input", set); set();
});

// services page: price list by car size
const list = document.getElementById("pkgs");
function renderPkgs(size) {
  if (!list) return;
  list.innerHTML = PKGS.map(p => `
    <article class="pkg${p.star ? " star" : ""}">
      <div>${p.star ? '<span class="flag">Most booked</span>' : ""}<h3>${p.name}</h3><span class="time">${p.time}</span></div>
      <ul>${p.items.map(i => `<li>${i}</li>`).join("")}</ul>
      <div class="price"><b>${peso(p.price[size])}</b><span>${SIZES[size]}</span></div>
    </article>`).join("");
  watch(list);
}
document.querySelectorAll(".sizes").forEach(group => {
  group.addEventListener("click", e => {
    const b = e.target.closest("button"); if (!b) return;
    group.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
    renderPkgs(b.dataset.size);
  });
});
if (list) { list.setAttribute("data-stagger", ""); renderPkgs("sedan"); }

// booking wizard
const wiz = document.getElementById("wizard");
if (wiz) {
  const state = { size: null, pkg: null, date: "", time: "", name: "", phone: "" };
  const panes = [...wiz.querySelectorAll("[data-pane]")];
  const steps = [...document.querySelectorAll(".steps li")];
  const back = document.getElementById("back"), next = document.getElementById("next"), err = document.getElementById("err");
  let at = 0;

  wiz.querySelector("#size-opts").innerHTML = Object.entries(SIZES).map(([k, v], i) => `
    <div class="opt"><input type="radio" name="size" id="s-${k}" value="${k}"><label for="s-${k}"><b>${v.split(" / ")[0]}</b><span>${["Vios, City, Civic", "Fortuner, Montero, Ranger", "Innova, Urvan, Staria"][i]}</span></label></div>`).join("");
  const pkgOpts = wiz.querySelector("#pkg-opts");
  const drawPkgs = () => pkgOpts.innerHTML = PKGS.map(p => `
    <div class="opt"><input type="radio" name="pkg" id="p-${p.id}" value="${p.id}"${state.pkg === p.id ? " checked" : ""}><label for="p-${p.id}"><b>${p.name}</b><span>${p.time}</span><em>${state.size ? peso(p.price[state.size]) : "from " + peso(p.price.sedan)}</em></label></div>`).join("");
  drawPkgs();

  const d = wiz.querySelector("#date");
  const t0 = new Date(); t0.setDate(t0.getDate() + 1);
  d.min = t0.toISOString().slice(0, 10);

  wiz.addEventListener("change", e => {
    const { name, value } = e.target;
    if (name in state) state[name] = value;
    if (name === "size") drawPkgs();
    summary(); err.textContent = "";
  });
  wiz.addEventListener("input", e => { if (e.target.name in state) state[e.target.name] = e.target.value; summary(); });

  function summary() {
    const p = PKGS.find(x => x.id === state.pkg);
    document.getElementById("sum-size").textContent = state.size ? SIZES[state.size] : "—";
    document.getElementById("sum-pkg").textContent = p ? p.name : "—";
    document.getElementById("sum-when").textContent = state.date ? `${new Date(state.date + "T00:00").toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric" })}${state.time ? ", " + state.time : ""}` : "—";
    document.getElementById("sum-total").textContent = p && state.size ? peso(p.price[state.size]) : "₱0";
  }
  const checks = [
    [() => !!state.size, "Pick your car size first."],
    [() => !!state.pkg, "Choose a package."],
    [() => !!(state.date && state.time), "Pick a date and a time slot."],
    [() => !!state.name.trim() && /^(09|\+639)\d{9}$/.test(state.phone.replace(/[\s-]/g, "")), "Add your name and a PH mobile number, e.g. 0917 123 4567."],
  ];
  function show(i) {
    at = i;
    panes.forEach((p, n) => p.hidden = n !== i);
    steps.forEach((s, n) => { s.classList.toggle("on", n === i); s.classList.toggle("done", n < i); });
    back.disabled = i === 0;
    next.querySelector("span").textContent = i === panes.length - 1 ? "Confirm booking" : "Continue";
    err.textContent = "";
  }
  back.addEventListener("click", () => show(Math.max(0, at - 1)));
  next.addEventListener("click", () => {
    const [ok, msg] = checks[at];
    if (!ok()) { err.textContent = msg; return; }
    if (at < panes.length - 1) return show(at + 1);
    wiz.hidden = true; document.querySelector(".steps").hidden = true;
    const done = document.getElementById("done");
    done.querySelector(".ref").textContent = "KTB-" + Math.random().toString(36).slice(2, 7).toUpperCase();
    done.querySelector(".who").textContent = state.name.trim().split(" ")[0];
    done.classList.add("show"); done.focus();
  });
  summary(); show(0);
}

watch();
