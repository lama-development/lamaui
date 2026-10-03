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
  const toast = root.querySelector<HTMLElement>("[data-guide-toast]");
  const toastTitle = toast?.querySelector<HTMLElement>(".lui-toast-body p");
  const toastMessage = toast?.querySelector<HTMLElement>("[data-guide-toast-message]");
  const actionMenus = Array.from(root.querySelectorAll<HTMLDetailsElement>("[data-guide-menu]"));
  let toastTimer: number | undefined;
  if (!content) return;
  const documentMarkdown = () => `# ${root.dataset.guideTitle}\n\n${root.dataset.guideDescription}\n\n${markdown(content)}Source: ${location.origin}${location.pathname}\n`;
  const closeActionMenus = (restoreFocus = false) => {
    actionMenus.forEach((menu) => {
      if (!menu.open) return;
      menu.open = false;
      if (restoreFocus) menu.querySelector("summary")?.focus();
    });
  };
  const showToast = (title: string, message: string) => {
    if (!toast) return;
    if (toastTitle) toastTitle.textContent = title;
    if (toastMessage) toastMessage.textContent = message;
    toast.classList.remove("hidden", "is-leaving");
    toast.classList.add("flex", "is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      toast.classList.add("is-leaving");
      window.setTimeout(() => {
        toast.classList.remove("flex", "is-leaving");
        toast.classList.add("hidden");
      }, 160);
    }, 3500);
  };
  root.querySelectorAll<HTMLElement>("[data-guide-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(documentMarkdown());
        showToast("Page copied", "Markdown copied to the clipboard.");
        closeActionMenus(true);
      } catch {
        showToast("Could not copy", "Download the Markdown file instead.");
      }
    });
  });
  root.querySelectorAll("[data-guide-copy-link]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(`${location.origin}${location.pathname}`);
        closeActionMenus(true);
        showToast("Link copied", "Page link copied to the clipboard.");
      } catch {
        showToast("Could not copy link", "Copy the page address from your browser instead.");
      }
    });
  });
  root.querySelectorAll("[data-guide-download]").forEach((button) => {
    button.addEventListener("click", () => {
      const url = URL.createObjectURL(new Blob([documentMarkdown()], { type: "text/markdown;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${root.dataset.guideSlug}.md`;
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      closeActionMenus(true);
      showToast("Download started", `${root.dataset.guideSlug}.md is being downloaded.`);
    });
  });
  root.querySelectorAll<HTMLButtonElement>("[data-guide-pdf]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      closeActionMenus(true);
      try {
        const { downloadGuidePdf } = await import("@/lib/guide-pdf");
        downloadGuidePdf(content, root.dataset.guideTitle || "Guide", root.dataset.guideDescription || "", root.dataset.guideSlug || "guide", `${location.origin}${location.pathname}`);
        showToast("Download started", `${root.dataset.guideSlug}.pdf is being downloaded.`);
      } catch {
        showToast("Could not download PDF", "Try again or use the Print option.");
      } finally {
        button.disabled = false;
      }
    });
  });
  root.querySelectorAll("[data-guide-print]").forEach((button) => {
    button.addEventListener("click", () => {
      closeActionMenus(true);
      window.print();
    });
  });
  document.addEventListener("pointerdown", (event) => {
    const target = event.target;
    if (target instanceof Node && !actionMenus.some((menu) => menu.contains(target))) closeActionMenus();
  });
  actionMenus.forEach((menu) => {
    menu.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeActionMenus(true);
      }
    });
    menu.addEventListener("focusout", (event) => {
      if (event.relatedTarget instanceof Node && !menu.contains(event.relatedTarget)) closeActionMenus();
    });
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
  const mobileIndex = root.querySelector<HTMLElement>("[data-guide-mobile-index]");
  const mobileIndexToggle = mobileIndex?.querySelector<HTMLButtonElement>("[data-guide-index-toggle]");
  const setMobileIndex = (open: boolean) => {
    if (!mobileIndex || !mobileIndexToggle) return;
    mobileIndex.dataset.open = String(open);
    mobileIndexToggle.setAttribute("aria-expanded", String(open));
  };
  mobileIndexToggle?.addEventListener("click", () => setMobileIndex(mobileIndex?.dataset.open !== "true"));
  mobileIndex?.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) setMobileIndex(false);
  });
  syncIndex();
});
