# Build & Run

## Prerequisites

- [Node.js](https://nodejs.org) 18 or later (includes npm)
- [Figma desktop app](https://www.figma.com/downloads/) — plugin development
  is not supported in the browser version

## 1. Install dependencies

```bash
npm install
```

## 2. Build

```bash
npm run build
```

This runs esbuild twice and produces:

- `dist/code.js` — the bundled plugin sandbox logic (`src/code.ts`)
- `dist/ui.html` — the plugin UI, with its JS bundle inlined into a single
  self-contained HTML file (required by Figma — the UI panel can't load
  external `<script src>` files)

## 3. Load it into Figma

1. Open the Figma desktop app.
2. Open (or create) any Figma file.
3. Open the Quick Actions search bar (`Cmd/Ctrl + /`) and run
   **"Import plugin from manifest…"**.
4. Select `manifest.json` at the root of this repo.
5. Run it via **Plugins → Development → Export Pro**.

Figma remembers the import, so after the first time you can just re-run the
plugin from the Plugins menu — you only need to re-import if you move the
project folder.

## 4. Development loop

Two watchers, one per bundle (the plugin sandbox and the UI are built
separately):

```bash
npm run watch:code   # rebuilds dist/code.js on change
npm run watch:ui      # rebuilds dist/ui.bundle.js and re-inlines dist/ui.html on change
```

Run both in separate terminals, or use the VS Code task **"Export Pro: Watch
All"** (see `.vscode/tasks.json`) to run them together.

After a change to `code.ts`, re-run the plugin in Figma (**Plugins →
Development → Export Pro**) to pick it up. After a change to `ui.ts`/`ui.html`,
just close and reopen the plugin panel — no need to re-run.

## 5. Type-check

```bash
npm run typecheck
```

Runs `tsc --noEmit` against `src/`. This is also what CI runs on every push
(see `.github/workflows/build.yml`).

## 6. Debugging

Figma plugins run inside Figma itself, not in a Node process, so VS Code's
debugger can't attach to them directly. To inspect logs / set breakpoints:

- Right-click the canvas → **Plugins → Development → Open Console**
  (or `Cmd/Ctrl + Option/Alt + I`) while the plugin is running.
- `console.log` calls in `src/code.ts` and `src/ui.ts` both show up there.

## 7. Package a distributable build

```bash
npm run package
```

Produces `dist-release/export-pro.zip`, containing only what's needed to
install the plugin (`manifest.json` + `dist/`). See
[`INSTALL.md`](INSTALL.md) for what to do with it.
