export {};

document.querySelectorAll<HTMLInputElement>("[data-slider]").forEach((slider) => {
  const output = slider.closest("label")?.querySelector<HTMLOutputElement>("[data-slider-output]");
  const update = () => {
    const min = Number(slider.min);
    const max = Number(slider.max);
    const value = Number(slider.value);
    const progress = max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : 0;
    slider.style.setProperty("--slider-progress", `${progress}%`);
    if (output) output.value = slider.value;
  };
  slider.addEventListener("input", update);
  slider.form?.addEventListener("reset", () => requestAnimationFrame(update));
  update();
});
