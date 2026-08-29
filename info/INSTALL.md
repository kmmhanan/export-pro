# Installing Export Pro

There are two real ways to get this plugin running: **local/manual install**
(what this doc covers) and **publishing to Figma Community** (a separate,
manual process — see the bottom of this page). There is no `.dmg`,
`.exe`, or other native installer, and that's not a limitation of this repo —
**Figma plugins don't work that way.** A plugin isn't a standalone app; it's
JavaScript + HTML that Figma's desktop app loads and runs inside itself.
The closest thing to an "installer" is a folder Figma imports via a manifest
file, which is exactly what's below.

## What you actually need

Only three files, all produced by `npm run build`:

```
manifest.json
dist/code.js
dist/ui.html
```

Nothing else — not `src/`, not `node_modules/`, not `package.json` — is
needed at runtime. `npm run package` (see [`BUILD.md`](BUILD.md)) collects
exactly these into `dist-release/export-pro.zip` for you.

## Option A — Install from source (you have the repo)

1. `npm install && npm run build` (see [`BUILD.md`](BUILD.md) for details).
2. In the Figma desktop app: Quick Actions (`Cmd/Ctrl + /`) →
   **"Import plugin from manifest…"** → select `manifest.json`.
3. Run it from **Plugins → Development → Export Pro**.

## Option B — Install from a shared zip (someone sent you `export-pro.zip`)

This is what you'd hand to a teammate who doesn't need the source, or what
CI attaches to a GitHub Release (see [`../.github/workflows`](../.github/workflows)).

1. Unzip `export-pro.zip` anywhere on disk. You should see `manifest.json`
   and a `dist/` folder sitting next to each other.
2. In the Figma desktop app: Quick Actions → **"Import plugin from
   manifest…"** → select the `manifest.json` you just unzipped.
3. Run it from **Plugins → Development → Export Pro**.

That's it — no build step needed on the installing machine, since the zip
already contains the compiled `dist/code.js` and `dist/ui.html`.

> **Note:** locally-imported plugins ("Development" plugins) are private to
> the Figma account/machine that imported them. To share a plugin with a
> whole team without everyone importing a zip, see **Team/Org sharing**
> below.

## Team / Org sharing (no public listing)

If you're on a Figma Organization or Enterprise plan, an admin can publish
the plugin as a **private plugin** visible only inside your org, without it
appearing in the public Community. This still goes through Figma's normal
publish flow (**Plugins → Development → Publish**) — just with the
visibility set to your organization instead of public. Ask your Figma admin
if this is enabled; the steps are the same as public publishing below.

## Publishing publicly to Figma Community

This is separate from installing, is done manually through the Figma
desktop UI (there's no public API for it), and needs a Figma account with
publishing permission on this plugin's `id`:

1. `npm run build` to make sure `dist/` is up to date.
2. In Figma desktop: **Plugins → Development → Export Pro → Manage plugins
   in-file**, or open the plugin from **Plugins → Development**, then choose
   **Publish**.
3. Fill in the listing details Figma asks for (description, tags, cover
   image, and the plugin icon — see [`ICON.md`](ICON.md)).
4. Submit. Figma reviews it before it goes live on Community.

Note: Figma enforces a 15MB limit on published plugin code — this plugin is
well under that.
