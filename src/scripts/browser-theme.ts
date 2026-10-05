const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
const mobileViewport = window.matchMedia("(max-width: 860px)");
const context = document.createElement("canvas").getContext("2d", { willReadFrequently: true });

if (themeColor && context) {
  const syncBrowserTheme = () => {
    const navbar = document.querySelector<HTMLElement>(mobileViewport.matches ? ".docs-mobile-header" : ".docs-sidebar");
    if (!navbar) return;
    // Resolve the accent-tinted surface to hex for browser chrome.
    context.clearRect(0, 0, 1, 1);
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
  mobileViewport.addEventListener("change", syncBrowserTheme);
  window.addEventListener("pageshow", syncBrowserTheme);
  document.addEventListener("astro:page-load", syncBrowserTheme);
  // Theme surfaces animate globally; sample again once the navbar reaches its final color.
  document.addEventListener("transitionend", (event) => {
    if (event.propertyName === "background-color" && event.target instanceof Element && event.target.matches(".docs-mobile-header, .docs-sidebar")) {
      syncBrowserTheme();
    }
  });
  syncBrowserTheme();
}
