import JSZip from "jszip";
import type {
  ExportFormat,
  ExportTemplate,
  PluginToUIMessage,
  SerializedExportFile,
  UIToPluginMessage,
} from "./types";

const root = document.getElementById("app") as HTMLDivElement;

let templates: ExportTemplate[] = [];
let hasSelection = false;
let saveTimer: number | undefined;

function post(msg: UIToPluginMessage): void {
  parent.postMessage({ pluginMessage: msg }, "*");
}

function uid(): string {
  return "tmpl-" + Math.random().toString(36).slice(2, 10);
}

function scheduleSave(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(
    () => post({ type: "save-templates", templates }),
    250,
  );
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

// ---------- Small inline icon set (stroke = currentColor, so it follows theme) ----------
const ICONS = {
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`,
  layers: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20Z"/></svg>`,
  coffee: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><path d="M6 2v2"/><path d="M10 2v2"/><path d="M14 2v2"/></svg>`,
};

// Update these if your website or Buy Me a Coffee link ever change.
const WEBSITE_URL = "https://kmmhanan.com";
const COFFEE_URL = "https://www.buymeacoffee.com/kmmhanan";

function iconEl(svg: string): HTMLSpanElement {
  const span = el("span");
  span.innerHTML = svg;
  return span;
}

function labeledField(
  label: string,
  input: HTMLElement,
  extraClass: string,
): HTMLElement {
  const wrap = el("div", `field ${extraClass}`);
  const l = el("label");
  l.textContent = label;
  wrap.appendChild(l);
  wrap.appendChild(input);
  return wrap;
}

function numberInput(
  value: number,
  step: number,
  onChange: (v: number) => void,
): HTMLInputElement {
  const input = el("input");
  input.type = "number";
  input.step = String(step);
  input.min = "0";
  input.value = String(value);
  input.oninput = () => onChange(parseFloat(input.value) || 0);
  return input;
}

function render(): void {
  root.innerHTML = "";

  // ---------- Header ----------
  const header = el("div", "header");
  const title = el("div", "title");
  title.textContent = "Export Pro";
  const status = el("div", `status-pill ${hasSelection ? "ok" : "muted"}`);
  const dot = el("span", "dot");
  const statusText = el("span");
  statusText.textContent = hasSelection ? "Selection ready" : "No selection";
  status.appendChild(dot);
  status.appendChild(statusText);
  header.appendChild(title);
  header.appendChild(status);
  root.appendChild(header);

  // ---------- List ----------
  const list = el("div", "list");
  if (templates.length === 0) {
    const empty = el("div", "empty");
    const icon = iconEl(ICONS.layers);
    const emptyTitle = el("div", "empty-title");
    emptyTitle.textContent = "No export templates yet";
    const emptySub = el("div", "empty-sub");
    emptySub.textContent = "Add one below to get started.";
    empty.appendChild(icon);
    empty.appendChild(emptyTitle);
    empty.appendChild(emptySub);
    list.appendChild(empty);
  } else {
    templates.forEach((tmpl, index) =>
      list.appendChild(renderRow(tmpl, index)),
    );
  }
  root.appendChild(list);

  // ---------- Add button ----------
  const addBtn = el("button", "add-btn");
  addBtn.appendChild(iconEl(ICONS.plus));
  const addLabel = el("span");
  addLabel.textContent = "Add export template";
  addBtn.appendChild(addLabel);
  addBtn.onclick = () => {
    templates.push({
      id: uid(),
      scale: 1,
      format: "PNG",
      suffix: "",
      borderRadius: 0,
      childFrameDepth: 0,
    });
    scheduleSave();
    render();
  };
  root.appendChild(addBtn);

  // ---------- Footer ----------
  const footer = el("div", "footer");
  const exportAllBtn = el("button", "primary-btn");
  exportAllBtn.appendChild(iconEl(ICONS.download));
  const exportLabel = el("span");
  exportLabel.textContent = "Export All";
  exportAllBtn.appendChild(exportLabel);
  if (templates.length > 0) {
    const count = el("span", "count");
    count.textContent = String(templates.length);
    exportAllBtn.appendChild(count);
  }
  exportAllBtn.disabled = !hasSelection || templates.length === 0;
  exportAllBtn.onclick = () => post({ type: "export-all", templates });
  footer.appendChild(exportAllBtn);

  const credits = el("div", "credits");

  const siteLink = el("a");
  siteLink.href = WEBSITE_URL;
  siteLink.target = "_blank";
  siteLink.rel = "noopener noreferrer";
  siteLink.appendChild(iconEl(ICONS.globe));
  const siteLabel = el("span");
  siteLabel.textContent = "kmmhanan.com";
  siteLink.appendChild(siteLabel);

  const coffeeLink = el("a");
  coffeeLink.href = COFFEE_URL;
  coffeeLink.target = "_blank";
  coffeeLink.rel = "noopener noreferrer";
  coffeeLink.appendChild(iconEl(ICONS.coffee));
  const coffeeLabel = el("span");
  coffeeLabel.textContent = "Buy me a coffee";
  coffeeLink.appendChild(coffeeLabel);

  credits.appendChild(siteLink);
  credits.appendChild(coffeeLink);
  footer.appendChild(credits);

  root.appendChild(footer);
}

function renderRow(tmpl: ExportTemplate, index: number): HTMLElement {
  const row = el("div", "row");

  const formatSelect = el("select", "format-select");
  (["PNG", "JPG", "SVG", "PDF"] as ExportFormat[]).forEach((fmt) => {
    const opt = el("option");
    opt.value = fmt;
    opt.textContent = fmt;
    opt.selected = fmt === tmpl.format;
    formatSelect.appendChild(opt);
  });
  formatSelect.onchange = () => {
    tmpl.format = formatSelect.value as ExportFormat;
    scheduleSave();
    render();
  };

  const scaleWrap = el("div", "scale-field");
  const scaleInput = numberInput(tmpl.scale, 0.5, (v) => {
    tmpl.scale = v;
    scheduleSave();
  });
  const isVector = tmpl.format === "SVG" || tmpl.format === "PDF";
  scaleInput.disabled = isVector;
  scaleInput.title = isVector
    ? "Scale is ignored for vector formats"
    : "Export scale";
  const scaleX = el("span");
  scaleX.textContent = "x";
  scaleWrap.appendChild(scaleInput);
  scaleWrap.appendChild(scaleX);

  const suffixInput = el("input");
  suffixInput.type = "text";
  suffixInput.placeholder = "blank = frame name";
  suffixInput.title =
    "Filename suffix (blank = use the exported node's own name)";
  suffixInput.value = tmpl.suffix;
  suffixInput.oninput = () => {
    tmpl.suffix = suffixInput.value;
    scheduleSave();
  };

  const radiusInput = numberInput(tmpl.borderRadius, 1, (v) => {
    tmpl.borderRadius = v;
    scheduleSave();
  });
  radiusInput.title = "Corner radius applied temporarily before export";

  const childInput = numberInput(tmpl.childFrameDepth, 1, (v) => {
    tmpl.childFrameDepth = Math.max(0, Math.round(v));
    scheduleSave();
  });
  childInput.title =
    "Levels to descend into the first child node (0 = the selection itself)";

  row.appendChild(labeledField("Type", formatSelect, "format"));
  row.appendChild(labeledField("Size", scaleWrap, "size"));
  row.appendChild(labeledField("Suffix", suffixInput, "suffix"));
  row.appendChild(labeledField("Radius", radiusInput, "radius"));
  row.appendChild(labeledField("Child", childInput, "child"));

  const actions = el("div", "row-actions");
  const exportOneBtn = el("button", "icon-btn export");
  exportOneBtn.title = "Export this template";
  exportOneBtn.appendChild(iconEl(ICONS.download));
  exportOneBtn.disabled = !hasSelection;
  exportOneBtn.onclick = () => post({ type: "export-one", template: tmpl });

  const deleteBtn = el("button", "icon-btn danger");
  deleteBtn.title = "Delete template";
  deleteBtn.appendChild(iconEl(ICONS.trash));
  deleteBtn.onclick = () => {
    templates.splice(index, 1);
    scheduleSave();
    render();
  };

  actions.appendChild(exportOneBtn);
  actions.appendChild(deleteBtn);
  row.appendChild(actions);

  return row;
}

function mimeFor(name: string): string {
  if (name.endsWith(".png")) return "image/png";
  if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
  if (name.endsWith(".svg")) return "image/svg+xml";
  if (name.endsWith(".pdf")) return "application/pdf";
  return "application/octet-stream";
}

function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = el("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function handleExportComplete(
  files: SerializedExportFile[],
): Promise<void> {
  if (files.length === 0) return;

  if (files.length === 1) {
    const f = files[0];
    downloadBlob(
      f.name,
      new Blob([new Uint8Array(f.bytes)], { type: mimeFor(f.name) }),
    );
    return;
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (const f of files) {
    let name = f.name;
    let counter = 1;
    while (usedNames.has(name)) {
      const dot = f.name.lastIndexOf(".");
      name = `${f.name.slice(0, dot)}-${counter}${f.name.slice(dot)}`;
      counter++;
    }
    usedNames.add(name);
    zip.file(name, new Uint8Array(f.bytes));
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob("export-pro-assets.zip", blob);
}

window.onmessage = (event: MessageEvent) => {
  const msg = event.data?.pluginMessage as PluginToUIMessage | undefined;
  if (!msg) return;

  switch (msg.type) {
    case "templates-loaded":
      templates = msg.templates;
      render();
      break;
    case "selection-changed":
      hasSelection = msg.hasSelection;
      render();
      break;
    case "export-complete":
      void handleExportComplete(msg.files);
      break;
    case "export-error":
      console.error("Export Pro error:", msg.message);
      break;
    case "export-progress":
      // Reserved for a future progress bar; no-op for now.
      break;
  }
};

post({ type: "load-templates" });
render();
