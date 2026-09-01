/// <reference types="@figma/plugin-typings" />

import type {
  ExportTemplate,
  PluginToUIMessage,
  SerializedExportFile,
  UIToPluginMessage,
} from "./types";

const STORAGE_KEY = "export-pro-templates-v1";

// Matches the example in the spec:
// 1. 4x  PNG  "rounded"  radius 130  child 0
// 2. 1x  SVG  "circle"   radius 512  child 0
// 3. 1x  SVG  (none)     radius 0    child 1
const DEFAULT_TEMPLATES: ExportTemplate[] = [
  {
    id: "tmpl-1",
    scale: 4,
    format: "PNG",
    suffix: "rounded",
    borderRadius: 130,
    childFrameDepth: 0,
  },
  {
    id: "tmpl-2",
    scale: 1,
    format: "SVG",
    suffix: "circle",
    borderRadius: 512,
    childFrameDepth: 0,
  },
  {
    id: "tmpl-3",
    scale: 1,
    format: "SVG",
    suffix: "",
    borderRadius: 0,
    childFrameDepth: 1,
  },
];

figma.showUI(__html__, {
  width: 420,
  height: 620,
  title: "Export Pro",
  themeColors: true,
});

function post(msg: PluginToUIMessage): void {
  figma.ui.postMessage(msg);
}

async function loadTemplates(): Promise<ExportTemplate[]> {
  const stored = (await figma.clientStorage.getAsync(STORAGE_KEY)) as
    | ExportTemplate[]
    | undefined;
  return stored && stored.length > 0 ? stored : DEFAULT_TEMPLATES;
}

async function saveTemplates(templates: ExportTemplate[]): Promise<void> {
  await figma.clientStorage.setAsync(STORAGE_KEY, templates);
}

/** Nodes that can have their corner radius adjusted (rectangle-corner mixin). */
type CornerNode = SceneNode & {
  cornerRadius: number | symbol;
  topLeftRadius: number;
  topRightRadius: number;
  bottomLeftRadius: number;
  bottomRightRadius: number;
};

function hasCorners(node: SceneNode): node is CornerNode {
  return "cornerRadius" in node && "topLeftRadius" in node;
}

/**
 * Temporarily sets a uniform corner radius on `node` for the duration of
 * `fn`, then restores the original (per-corner) values — even if the
 * original state was "mixed" corners.
 */
async function withTemporaryCornerRadius<T>(
  node: SceneNode,
  radius: number,
  fn: () => Promise<T>,
): Promise<T> {
  if (radius <= 0 || !hasCorners(node)) {
    return fn();
  }

  const original = {
    topLeft: node.topLeftRadius,
    topRight: node.topRightRadius,
    bottomLeft: node.bottomLeftRadius,
    bottomRight: node.bottomRightRadius,
  };

  node.cornerRadius = radius;

  try {
    return await fn();
  } finally {
    node.topLeftRadius = original.topLeft;
    node.topRightRadius = original.topRight;
    node.bottomLeftRadius = original.bottomLeft;
    node.bottomRightRadius = original.bottomRight;
  }
}

/**
 * Walks `depth` levels down from `node`, taking the first child at each
 * level — regardless of type, so a vector, image/rectangle, group,
 * component, or instance works just as well as a frame. depth 0 returns
 * `node` itself. Returns null if a level has no children to descend into.
 */
function findChildFrame(node: SceneNode, depth: number): SceneNode | null {
  let current: SceneNode = node;
  for (let i = 0; i < depth; i++) {
    if (!("children" in current)) return null;
    const children = (current as SceneNode & ChildrenMixin).children;
    const nextChild = children[0];
    if (!nextChild) return null;
    current = nextChild;
  }
  return current;
}

function buildFileName(
  rootNode: SceneNode,
  targetNode: SceneNode,
  template: ExportTemplate,
): string {
  const ext = template.format.toLowerCase();
  const suffix = template.suffix.trim();
  const baseName =
    suffix.length > 0 ? `${rootNode.name}-${suffix}` : targetNode.name;
  return `${sanitizeFileName(baseName)}.${ext}`;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").trim();
}

async function exportSingle(
  rootNode: SceneNode,
  template: ExportTemplate,
): Promise<{ name: string; bytes: Uint8Array } | null> {
  const target =
    template.childFrameDepth > 0
      ? findChildFrame(rootNode, template.childFrameDepth)
      : rootNode;

  if (!target) {
    figma.notify(
      `Export Pro: couldn't find a nested child ${template.childFrameDepth} level(s) inside "${rootNode.name}"`,
    );
    return null;
  }

  const bytes = await withTemporaryCornerRadius(
    target,
    template.borderRadius,
    async () => {
      if (template.format === "SVG") {
        return target.exportAsync({ format: "SVG" });
      }
      if (template.format === "PDF") {
        return target.exportAsync({ format: "PDF" });
      }
      return target.exportAsync({
        format: template.format,
        constraint: { type: "SCALE", value: template.scale },
      });
    },
  );

  return { name: buildFileName(rootNode, target, template), bytes };
}

async function runExport(templates: ExportTemplate[]): Promise<void> {
  const selection = figma.currentPage.selection;

  if (selection.length === 0) {
    figma.notify("Export Pro: select at least one frame or layer first");
    post({ type: "export-error", message: "No selection" });
    return;
  }
  if (templates.length === 0) {
    figma.notify("Export Pro: add at least one export template first");
    return;
  }

  const files: SerializedExportFile[] = [];
  const total = selection.length * templates.length;
  let done = 0;

  for (const node of selection) {
    for (const template of templates) {
      const result = await exportSingle(node, template);
      if (result) {
        files.push({
          name: result.name,
          bytes: Array.from(result.bytes),
          templateId: template.id,
        });
      }
      done++;
      post({ type: "export-progress", done, total });
    }
  }

  if (files.length === 0) {
    figma.notify("Export Pro: nothing was exported — check your templates");
    post({ type: "export-error", message: "Nothing exported" });
    return;
  }

  post({ type: "export-complete", files });
}

figma.ui.onmessage = async (msg: UIToPluginMessage) => {
  switch (msg.type) {
    case "load-templates": {
      const templates = await loadTemplates();
      post({ type: "templates-loaded", templates });
      break;
    }
    case "save-templates": {
      await saveTemplates(msg.templates);
      break;
    }
    case "export-all": {
      await runExport(msg.templates);
      break;
    }
    case "export-one": {
      await runExport([msg.template]);
      break;
    }
    case "export-downloaded": {
      const label = msg.fileCount === 1 ? "file" : "files";
      figma.closePlugin(
        `Export Pro: exported ${msg.fileCount} ${label} successfully 🎉`,
      );
      break;
    }
  }
};

figma.on("selectionchange", () => {
  const selection = figma.currentPage.selection;
  post({
    type: "selection-changed",
    hasSelection: selection.length > 0,
    nodeNames: selection.map((n) => n.name),
  });
});

// Push initial selection state as soon as the UI is ready to receive it.
post({
  type: "selection-changed",
  hasSelection: figma.currentPage.selection.length > 0,
  nodeNames: figma.currentPage.selection.map((n) => n.name),
});
