import JSZip from 'jszip';
import type { ExportFormat, ExportTemplate, PluginToUIMessage, SerializedExportFile, UIToPluginMessage } from './types';

const root = document.getElementById('app') as HTMLDivElement;

let templates: ExportTemplate[] = [];
let hasSelection = false;
let saveTimer: number | undefined;

function post(msg: UIToPluginMessage): void {
  parent.postMessage({ pluginMessage: msg }, '*');
}

function uid(): string {
  return 'tmpl-' + Math.random().toString(36).slice(2, 10);
}

function scheduleSave(): void {
  window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => post({ type: 'save-templates', templates }), 250);
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function labeledField(label: string, input: HTMLElement): HTMLElement {
  const wrap = el('div', 'field');
  const l = el('label');
  l.textContent = label;
  wrap.appendChild(l);
  wrap.appendChild(input);
  return wrap;
}

function numberInput(value: number, step: number, onChange: (v: number) => void): HTMLInputElement {
  const input = el('input');
  input.type = 'number';
  input.step = String(step);
  input.min = '0';
  input.value = String(value);
  input.oninput = () => onChange(parseFloat(input.value) || 0);
  return input;
}

function render(): void {
  root.innerHTML = '';

  const header = el('div', 'header');
  const title = el('div', 'title');
  title.textContent = 'Export Pro';
  const status = el('div', `status ${hasSelection ? 'ok' : 'muted'}`);
  status.textContent = hasSelection ? 'Selection ready' : 'Select a frame or layer';
  header.appendChild(title);
  header.appendChild(status);
  root.appendChild(header);

  const list = el('div', 'list');
  if (templates.length === 0) {
    const empty = el('div', 'empty');
    empty.textContent = 'No export templates yet. Add one below.';
    list.appendChild(empty);
  } else {
    templates.forEach((tmpl, index) => list.appendChild(renderRow(tmpl, index)));
  }
  root.appendChild(list);

  const addBtn = el('button', 'add-btn');
  addBtn.textContent = '+ Add export template';
  addBtn.onclick = () => {
    templates.push({ id: uid(), scale: 1, format: 'PNG', suffix: '', borderRadius: 0, childFrameDepth: 0 });
    scheduleSave();
    render();
  };
  root.appendChild(addBtn);

  const footer = el('div', 'footer');
  const exportAllBtn = el('button', 'primary-btn');
  exportAllBtn.textContent = `Export All (${templates.length})`;
  exportAllBtn.disabled = !hasSelection || templates.length === 0;
  exportAllBtn.onclick = () => post({ type: 'export-all', templates });
  footer.appendChild(exportAllBtn);
  root.appendChild(footer);
}

function renderRow(tmpl: ExportTemplate, index: number): HTMLElement {
  const row = el('div', 'row');

  const formatSelect = el('select');
  (['PNG', 'JPG', 'SVG', 'PDF'] as ExportFormat[]).forEach((fmt) => {
    const opt = el('option');
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

  const scaleWrap = el('div', 'scale-field');
  const scaleInput = numberInput(tmpl.scale, 0.5, (v) => {
    tmpl.scale = v;
    scheduleSave();
  });
  const isVector = tmpl.format === 'SVG' || tmpl.format === 'PDF';
  scaleInput.disabled = isVector;
  const scaleX = el('span');
  scaleX.textContent = 'x';
  scaleWrap.appendChild(scaleInput);
  scaleWrap.appendChild(scaleX);

  const suffixInput = el('input');
  suffixInput.type = 'text';
  suffixInput.placeholder = 'e.g. rounded (blank = use frame name)';
  suffixInput.value = tmpl.suffix;
  suffixInput.oninput = () => {
    tmpl.suffix = suffixInput.value;
    scheduleSave();
  };

  const radiusInput = numberInput(tmpl.borderRadius, 1, (v) => {
    tmpl.borderRadius = v;
    scheduleSave();
  });

  const childInput = numberInput(tmpl.childFrameDepth, 1, (v) => {
    tmpl.childFrameDepth = Math.max(0, Math.round(v));
    scheduleSave();
  });

  const actions = el('div', 'row-actions');
  const exportOneBtn = el('button', 'mini-btn');
  exportOneBtn.textContent = 'Export';
  exportOneBtn.disabled = !hasSelection;
  exportOneBtn.onclick = () => post({ type: 'export-one', template: tmpl });

  const deleteBtn = el('button', 'mini-btn danger');
  deleteBtn.textContent = 'Delete';
  deleteBtn.onclick = () => {
    templates.splice(index, 1);
    scheduleSave();
    render();
  };

  actions.appendChild(exportOneBtn);
  actions.appendChild(deleteBtn);

  row.appendChild(labeledField('Type', formatSelect));
  row.appendChild(labeledField('Size', scaleWrap));
  row.appendChild(labeledField('Suffix', suffixInput));
  row.appendChild(labeledField('Radius', radiusInput));
  row.appendChild(labeledField('Child frame', childInput));
  row.appendChild(actions);

  return row;
}

function mimeFor(name: string): string {
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.svg')) return 'image/svg+xml';
  if (name.endsWith('.pdf')) return 'application/pdf';
  return 'application/octet-stream';
}

function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = el('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function handleExportComplete(files: SerializedExportFile[]): Promise<void> {
  if (files.length === 0) return;

  if (files.length === 1) {
    const f = files[0];
    downloadBlob(f.name, new Blob([new Uint8Array(f.bytes)], { type: mimeFor(f.name) }));
    return;
  }

  const zip = new JSZip();
  const usedNames = new Set<string>();
  for (const f of files) {
    let name = f.name;
    let counter = 1;
    while (usedNames.has(name)) {
      const dot = f.name.lastIndexOf('.');
      name = `${f.name.slice(0, dot)}-${counter}${f.name.slice(dot)}`;
      counter++;
    }
    usedNames.add(name);
    zip.file(name, new Uint8Array(f.bytes));
  }
  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob('export-pro-assets.zip', blob);
}

window.onmessage = (event: MessageEvent) => {
  const msg = event.data?.pluginMessage as PluginToUIMessage | undefined;
  if (!msg) return;

  switch (msg.type) {
    case 'templates-loaded':
      templates = msg.templates;
      render();
      break;
    case 'selection-changed':
      hasSelection = msg.hasSelection;
      render();
      break;
    case 'export-complete':
      void handleExportComplete(msg.files);
      break;
    case 'export-error':
      console.error('Export Pro error:', msg.message);
      break;
    case 'export-progress':
      // Reserved for a future progress bar; no-op for now.
      break;
  }
};

post({ type: 'load-templates' });
render();
