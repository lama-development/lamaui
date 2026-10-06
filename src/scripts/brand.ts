const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
document.querySelectorAll<HTMLButtonElement>("[data-brand-llama]").forEach((button) => {
  let clicks = 0;
  let lastClick = 0;
  let celebrating = false;
  let bounce: Animation | undefined;
  button.addEventListener("click", () => {
    if (celebrating) return;
    const now = performance.now();
    clicks = now - lastClick < 900 ? clicks + 1 : 1;
    lastClick = now;
    const mark = button.querySelector<SVGElement>("svg");
    if (!mark) return;
    if (!reduceMotion.matches) {
      bounce?.cancel();
      const tilt = (clicks % 2 ? -1 : 1) * (5 + clicks * 2);
      bounce = mark.animate([{ transform: "scale(1) rotate(0)" }, { transform: `scale(1.12) rotate(${tilt}deg)`, offset: 0.35 }, { transform: "scale(1) rotate(0)" }], { duration: 350, easing: "cubic-bezier(0.2, 0, 0.2, 1)" });
    }
    if (clicks < 10) return;
    clicks = 0;
    celebrating = true;
    const rect = button.getBoundingClientRect();
    const party = document.createElement("div");
    party.setAttribute("aria-hidden", "true");
    Object.assign(party.style, {
      position: "fixed",
      inset: "0",
      pointerEvents: "none",
      zIndex: "10000",
      overflow: "hidden"
    });
    document.body.append(party);
    if (!reduceMotion.matches) {
      for (let i = 0; i < 18; i++) {
        const llama = i % 3 === 0;
        const particle = llama ? (mark.cloneNode(true) as SVGElement) : document.createElement("span");
        particle.removeAttribute("class");
        const size = llama ? 24 : 6;
        Object.assign(particle.style, {
          position: "absolute",
          left: `${rect.left + rect.width / 2 - size / 2}px`,
          top: `${rect.top + rect.height / 2 - size / 2}px`,
          width: `${size}px`,
          height: `${size}px`,
          background: llama ? "transparent" : i % 2 ? "var(--accent)" : "var(--label)",
          borderRadius: i % 2 ? "50%" : "2px",
          transition: "none"
        });
        party.append(particle);
        const dx = 20 + Math.random() * 180;
        const dy = 35 + Math.random() * 100;
        particle.animate(
          [
            { transform: "translate(0, 0) rotate(0) scale(0.4)", opacity: 0 },
            { transform: `translate(${dx * 0.5}px, ${-dy}px) rotate(${i * 20}deg) scale(1)`, opacity: 1, offset: 0.35 },
            { transform: `translate(${dx}px, ${80 + Math.random() * 100}px) rotate(${i * 40}deg) scale(0.7)`, opacity: 0 }
          ],
          { duration: 1300 + Math.random() * 500, delay: i * 18, fill: "both", easing: "ease-out" }
        );
      }
    }
    window.setTimeout(() => {
      party.remove();
      celebrating = false;
    }, 2300);
  });
});
