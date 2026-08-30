export type ExportFormat = "PNG" | "JPG" | "SVG" | "PDF";

/**
 * One persistent export "preset". A user can define many of these and they
 * apply to whatever is currently selected — that's the whole point of the
 * plugin (Figma's native export panel forgets settings when you change
 * selection, this list never does).
 */
export interface ExportTemplate {
  id: string;
  /** "nx" — export scale, e.g. 1, 2, 4. Ignored for SVG/PDF. */
  scale: number;
  format: ExportFormat;
  /**
   * Filename suffix. If set, output is `${selectedNodeName}-${suffix}.${ext}`.
   * If empty, output uses the *target* node's own name instead (see
   * childFrameDepth) — this matches the "null suffix" case in the spec.
   */
  suffix: string;
  /** Corner radius to temporarily apply before exporting. 0 = leave as-is. */
  borderRadius: number;
  /**
   * 0 = export the selected node itself.
   * N = walk N levels down, each time taking the *first child* (any type —
   * a frame, vector, image/rectangle, group, component, or instance all
   * work) and export *that* node instead (and use its own name if suffix
   * is empty).
   */
  childFrameDepth: number;
}

export interface SerializedExportFile {
  name: string;
  bytes: number[];
  templateId: string;
}

/** Messages sent from the UI (iframe) to the plugin sandbox (code.ts). */
export type UIToPluginMessage =
  | { type: "load-templates" }
  | { type: "save-templates"; templates: ExportTemplate[] }
  | { type: "export-all"; templates: ExportTemplate[] }
  | { type: "export-one"; template: ExportTemplate }
  | { type: "export-downloaded"; fileCount: number };

/** Messages sent from the plugin sandbox (code.ts) to the UI (iframe). */
export type PluginToUIMessage =
  | { type: "templates-loaded"; templates: ExportTemplate[] }
  | { type: "selection-changed"; hasSelection: boolean; nodeNames: string[] }
  | { type: "export-progress"; done: number; total: number }
  | { type: "export-complete"; files: SerializedExportFile[] }
  | { type: "export-error"; message: string };
