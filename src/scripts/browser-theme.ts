const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const navbar = document.querySelector<HTMLElement>(".docs-sidebar");
const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });

if (themeColor && navbar && context) {
  const syncBrowserTheme = () => {
    // Resolve the accent-tinted surface to hex for browser chrome.
    context.fillStyle = getComputedStyle(navbar).backgroundColor;
    context.fillRect(0, 0, 1, 1);
    const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
    themeColor.content = `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
  };

  new MutationObserver(syncBrowserTheme).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-accent"]
  });
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", syncBrowserTheme);
  syncBrowserTheme();
}
