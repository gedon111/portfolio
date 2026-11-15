// Dahon Coffee House: concept mockup. Nothing is sent anywhere.
document.documentElement.classList.remove("no-js");

// mobile menu
const burger = document.querySelector(".burger"), menu = document.querySelector(".menu");
if (burger) burger.addEventListener("click", () => burger.setAttribute("aria-expanded", menu.classList.toggle("open")));

// "open now" line from the real clock (cafe hours: 7 AM to 9 PM, closed Mondays)
const open = document.getElementById("open-now");
if (open) {
  const d = new Date(), h = d.getHours() + d.getMinutes() / 60, mon = d.getDay() === 1;
  open.textContent = mon ? "Closed today, back Tuesday at 7 AM" : h >= 7 && h < 21 ? "Open now until 9 PM" : "Closed now, opens at 7 AM";
  if (mon || h < 7 || h >= 21) open.previousElementSibling.style.background = "#8e2f2a";
}

// sheets settle in as they scroll into view, 30 ms apart inside a group
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}), { rootMargin: "0px 0px -8% 0px" }) : null;
document.querySelectorAll("[data-stagger]").forEach(g => [...g.children].forEach((c, i) => { c.classList.add("rv"); c.style.setProperty("--i", i); }));
document.querySelectorAll(".rv").forEach(el => io ? io.observe(el) : el.classList.add("in"));

// menu filter tabs
const tabs = document.querySelector(".tabs");
if (tabs) tabs.addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b) return;
  tabs.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b));
  const f = b.dataset.f;
  document.querySelectorAll(".group").forEach(g => { g.hidden = f !== "all" && g.dataset.cat !== f; });
});

// reservation form (demo only)
const form = document.getElementById("reserve");
if (form) {
  const date = form.querySelector("#r-date"), t = new Date();
  date.min = t.toISOString().slice(0, 10);
  form.addEventListener("submit", e => {
    e.preventDefault();
    const err = document.getElementById("r-err"), v = Object.fromEntries(new FormData(form));
    if (!v.name.trim()) return err.textContent = "Please add your name.";
    if (!v.date || !v.time) return err.textContent = "Pick a date and a time.";
    if (new Date(v.date + "T00:00").getDay() === 1) return err.textContent = "We're closed on Mondays, pick another day.";
    form.hidden = true;
    const ok = document.getElementById("thanks");
    ok.querySelector(".who").textContent = v.name.trim().split(" ")[0];
    ok.querySelector(".when").textContent = new Date(v.date + "T00:00").toLocaleDateString("en-PH", { weekday: "long", month: "long", day: "numeric" }) + ", " + v.time;
    ok.querySelector(".pax").textContent = v.pax;
    ok.querySelector(".ref").textContent = "DHN-" + Math.random().toString(36).slice(2, 6).toUpperCase();
    ok.classList.add("show"); ok.focus();
  });
}
