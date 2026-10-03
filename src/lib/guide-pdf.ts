import { jsPDF } from "jspdf";

export function downloadGuidePdf(content: HTMLElement, title: string, description: string, slug: string, source: string) {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 48;
  const width = pdf.internal.pageSize.getWidth() - margin * 2;
  const bottom = pdf.internal.pageSize.getHeight() - 60;
  let y = margin;

  const write = (text: string, size = 11, font = "helvetica", style = "normal", code = false) => {
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    const lines: string[] = pdf.splitTextToSize(text, width - (code ? 20 : 0));
    const lineHeight = size * 1.45;
    for (const line of lines) {
      if (y + lineHeight > bottom) {
        pdf.addPage();
        y = margin;
      }
      if (code) {
        pdf.setFillColor(242, 244, 246);
        pdf.rect(margin, y - 3, width, lineHeight, "F");
      }
      pdf.setTextColor(30, 38, 44);
      pdf.text(line, margin + (code ? 10 : 0), y + size);
      y += lineHeight;
    }
    y += code ? 12 : 10;
  };

  const visit = (node: Element) => {
    if (!(node instanceof HTMLElement) || node.hidden || node.matches("[data-guide-no-export],button,svg,figcaption")) return;
    const text = node.textContent?.trim() || "";
    if (!text) return;
    if (/^H[1-6]$/.test(node.tagName)) {
      y += 8;
      if (y + 64 > bottom) { pdf.addPage(); y = margin; }
      write(text, node.tagName === "H2" ? 18 : 14, "helvetica", "bold");
    } else if (node.tagName === "PRE") write(text, 9, "courier", "normal", true);
    else if (node.tagName === "P") write(text);
    else if (node.tagName === "UL" || node.tagName === "OL") {
      Array.from(node.children).forEach((item, index) => write(`${node.tagName === "OL" ? `${index + 1}.` : "•"} ${item.textContent?.trim() || ""}`));
    } else if (node.tagName === "TABLE") {
      node.querySelectorAll("tr").forEach((row) => write(Array.from(row.children).map((cell) => cell.textContent?.trim()).join(" | ")));
    } else Array.from(node.children).forEach(visit);
  };

  write(title, 28, "helvetica", "bold");
  write(description, 12);
  Array.from(content.children).forEach(visit);
  write(`Source: ${source}`, 9);
  const pages = pdf.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    pdf.setPage(page);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 110, 118);
    pdf.text(`LamaUI · ${title}`, margin, bottom + 30);
    pdf.text(`${page} / ${pages}`, margin + width, bottom + 30, { align: "right" });
  }
  pdf.save(`${slug}.pdf`);
}
