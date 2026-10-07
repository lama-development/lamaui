// Measure each table's actual inset so nested examples retain their spacing.
const tables = document.querySelectorAll<HTMLElement>(".docs-content .lamaui-table-scroll");
const mobileTables = window.matchMedia("(max-width: 860px)");

const measureTables = () => {
  // Restore normal geometry before measuring; batch reads before writes.
  tables.forEach((table) => {
    table.style.removeProperty("--table-inset-start");
    table.style.removeProperty("--table-inset-end");
    table.removeAttribute("data-edge-scroll");
  });
  if (!mobileTables.matches) return;
  const viewportWidth = document.documentElement.clientWidth;
  const insets = Array.from(tables, (table) => {
    const rect = table.getBoundingClientRect();
    return { table, start: Math.max(0, rect.left), end: Math.max(0, viewportWidth - rect.right) };
  });
  insets.forEach(({ table, start, end }) => {
    table.style.setProperty("--table-inset-start", `${start}px`);
    table.style.setProperty("--table-inset-end", `${end}px`);
    table.setAttribute("data-edge-scroll", "");
  });
};

let measurementFrame = 0;
const scheduleMeasurement = () => {
  if (measurementFrame) return;
  measurementFrame = requestAnimationFrame(() => {
    measurementFrame = 0;
    measureTables();
  });
};
const tableResizeObserver = new ResizeObserver(scheduleMeasurement);
// Observe containers, rather than the scroll areas changed by measurement.
new Set(Array.from(tables, (table) => table.parentElement)).forEach((parent) => {
  if (parent) tableResizeObserver.observe(parent);
});
window.addEventListener("resize", scheduleMeasurement, { passive: true });
mobileTables.addEventListener("change", scheduleMeasurement);
measureTables();
