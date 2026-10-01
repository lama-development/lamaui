function inline(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
  if (!(node instanceof HTMLElement) || node.hidden || node.classList.contains("sr-only")) return "";
  const text = Array.from(node.childNodes).map(inline).join("");
  if (node.tagName === "CODE") return `\`${text}\``;
  if (node.tagName === "STRONG" || node.tagName === "B") return `**${text}**`;
  if (node.tagName === "A") return `[${text}](${node.getAttribute("href") || ""})`;
  if (node.tagName === "BR") return "\n";
  return text;
}

function markdown(node: Element): string {
  if (!(node instanceof HTMLElement) || node.hidden || node.matches("[data-guide-no-export],button,svg,figcaption")) return "";
  if (/^H[1-6]$/.test(node.tagName)) return `${"#".repeat(Number(node.tagName[1]))} ${inline(node).trim()}\n\n`;
  if (node.tagName === "P") return `${inline(node).trim()}\n\n`;
  if (node.tagName === "PRE") return `\`\`\`astro\n${node.textContent?.trim()}\n\`\`\`\n\n`;
  if (node.tagName === "UL" || node.tagName === "OL")
    return (
      Array.from(node.children)
        .map((item, index) => `${node.tagName === "OL" ? `${index + 1}.` : "-"} ${inline(item).trim()}\n`)
        .join("") + "\n"
    );
  if (node.tagName === "TABLE") {
    const rows = Array.from(node.querySelectorAll("tr")).map(
      (row) =>
        `| ${Array.from(row.children)
          .map((cell) => inline(cell).trim().replace(/\|/g, "\\|").replace(/\s+/g, " "))
          .join(" | ")} |`
    );
    if (rows.length)
      rows.splice(
        1,
        0,
        `| ${Array.from(node.querySelectorAll("thead th"))
          .map(() => "---")
          .join(" | ")} |`
      );
    return rows.join("\n") + "\n\n";
  }
  return Array.from(node.children).map(markdown).join("");
}

document.querySelectorAll<HTMLElement>("[data-guide]").forEach((root) => {
  const content = root.querySelector<HTMLElement>("[data-guide-content]");
  const status = root.querySelector<HTMLElement>("[data-guide-status]");
  const exportMenu = root.querySelector<HTMLDetailsElement>("[data-guide-export]");
  if (!content) return;
  const documentMarkdown = () => `# ${root.dataset.guideTitle}\n\n${root.dataset.guideDescription}\n\n${markdown(content)}Source: ${location.origin}${location.pathname}\n`;
  const closeExport = (restoreFocus = false) => {
    if (!exportMenu) return;
    exportMenu.open = false;
    if (restoreFocus) exportMenu.querySelector("summary")?.focus();
  };
  root.querySelector("[data-guide-copy]")?.addEventListener("click", async () => {
    const label = root.querySelector("[data-guide-copy-label]");
    try {
      await navigator.clipboard.writeText(documentMarkdown());
      if (label) label.textContent = "Copied";
      if (status) status.textContent = "Page copied as Markdown.";
    } catch {
      if (status) status.textContent = "Could not copy. Use Export to download the Markdown file.";
    }
    window.setTimeout(() => {
      if (label) label.textContent = "Copy page";
    }, 2000);
  });
  root.querySelector("[data-guide-download]")?.addEventListener("click", () => {
    const url = URL.createObjectURL(new Blob([documentMarkdown()], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${root.dataset.guideSlug}.md`;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    closeExport(true);
    if (status) status.textContent = "Markdown download started.";
  });
  root.querySelector("[data-guide-print]")?.addEventListener("click", () => {
    closeExport(true);
    window.print();
  });
  document.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Node && !exportMenu?.contains(event.target)) closeExport();
  });
  exportMenu?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeExport(true);
    }
  });
  exportMenu?.addEventListener("focusout", (event) => {
    if (event.relatedTarget instanceof Node && !exportMenu.contains(event.relatedTarget)) closeExport();
  });

  const links = Array.from(root.querySelectorAll<HTMLAnchorElement>("[data-guide-anchor]"));
  const headings = Array.from(new Set(links.map((link) => link.dataset.guideAnchor)))
    .map((id) => (id ? document.getElementById(id) : null))
    .filter((heading): heading is HTMLElement => heading instanceof HTMLElement);
  let scheduled = false;
  const syncIndex = () => {
    scheduled = false;
    const scrollPadding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
    const active = headings.filter((heading) => heading.getBoundingClientRect().top <= scrollPadding + (parseFloat(getComputedStyle(heading).scrollMarginTop) || 0) + 1).at(-1) || headings[0];
    links.forEach((link) => {
      if (link.dataset.guideAnchor === active?.id) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(syncIndex);
      }
    },
    { passive: true }
  );
  window.addEventListener("resize", syncIndex);
  root.querySelector("[data-guide-mobile-index]")?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) (root.querySelector("[data-guide-mobile-index]") as HTMLDetailsElement).open = false;
  });
  syncIndex();
});
