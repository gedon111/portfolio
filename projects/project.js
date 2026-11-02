const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

const clock = document.getElementById("clock");
const tick = () => { clock.textContent = new Date().toLocaleTimeString("en-GB"); };
tick(); setInterval(tick, 1000);

gsap.registerPlugin(ScrollTrigger);
if (!reduce) {
  gsap.set("#bar", { scaleX: 0 });
  gsap.to("#bar", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: true } });

  const h = gsap.timeline({ defaults: { ease: "power4.out" } });
  h.from(".phero-copy > *", { y: 36, opacity: 0, stagger: 0.09, duration: 0.9 })
   .from(".phero-shot img", { y: 60, rotate: 2.5, opacity: 0, duration: 1.1 }, 0.15);

  gsap.to(".phero-shot img", { yPercent: -5, ease: "none",
    scrollTrigger: { trigger: ".phero", start: "top top", end: "bottom top", scrub: true } });

  document.querySelectorAll(".step").forEach(s => {
    const flip = s.classList.contains("flip") ? 1 : -1;
    gsap.from(s.querySelector("img"), { x: 60 * flip, rotate: 2 * flip, opacity: 0.2, ease: "none",
      scrollTrigger: { trigger: s, start: "top 85%", end: "top 35%", scrub: true } });
    gsap.from(s.querySelector(".num"), { yPercent: 40, opacity: 0, duration: 0.9, ease: "back.out(2)",
      scrollTrigger: { trigger: s, start: "top 70%" } });
    gsap.from(s.querySelectorAll(".step-copy h3, .step-copy p"), { y: 30, opacity: 0, stagger: 0.12, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: s, start: "top 65%" } });
  });
  gsap.from(".facts li", { y: 24, opacity: 0, stagger: 0.1, duration: 0.7, delay: 0.5, ease: "back.out(2)" });
}
