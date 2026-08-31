Template-based exports designed for speed and consistency

## Why Export Pro

Figma's built-in export panel is tied to whatever's selected — switch to a
different frame and your export settings are gone. Export Pro keeps a
persistent list of export templates instead, so the same presets are
always there no matter what you select.

Set it up once. Reuse it on every frame, every file, every time.

## Features

- **Persistent templates** — define export presets once; they survive
  selection changes and don't need to be rebuilt per layer.
- **PNG, JPG, SVG, and PDF** — export scale applies where it matters (PNG/JPG)
  and is ignored where it doesn't (SVG/PDF).
- **Per-template export** — export just one preset against your current
  selection with its own dedicated button.
- **Export All** — run every template at once; multiple outputs are
  automatically bundled into a single zip download.
- **Temporary corner radius** — apply a border radius just for the export
  (e.g. render a square icon as a circle) without changing your actual
  design. The original radius is restored right after, even from a mixed
  state.
- **Nested targeting** — export a node buried inside your selection
  (a vector, an image, a child frame — any type) instead of only the
  top-level selection.

## How a template works

Each template has five settings:

- **Type** — PNG, JPG, SVG, or PDF
- **Size** — export scale (1x, 2x, 4x...)
- **Suffix** — appended to the selected layer's name for the filename. Leave
  it blank to use the exported node's own name instead.
- **Radius** — a corner radius applied only during export, then reverted
- **Child** — how many levels to descend into the first child node before
  exporting (0 = export the selection itself)

## Example

Select a frame named "app icon" and run three templates:

- 4x PNG, suffix "rounded", radius 130 → app icon-rounded.png
- 1x SVG, suffix "circle", radius 512 → app icon-circle.svg
- 1x SVG, no suffix, child depth 1 → exports the first nested layer inside
  "app icon", named after itself

Hit Export All once, and all three come out together — no rebuilding
settings between frames.

## Privacy

Export Pro runs entirely locally. It doesn't send your designs, layer
names, or any other data anywhere — network access is disabled in the
plugin itself.

## Feedback

Found a bug or have a feature idea? Leave a comment below — I read all of
them.

## Support this plugin

If Export Pro saves you time, consider [buying me a coffee](https://www.buymeacoffee.com/kmmhanan).
More at [kmmhanan.com](https://kmmhanan.com).

## Changelog

**v1.0.0** — Initial release: persistent template list, PNG/JPG/SVG/PDF
export, per-template and Export All actions, temporary corner radius,
nested-node targeting.
