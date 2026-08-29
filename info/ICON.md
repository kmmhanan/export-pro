# Changing the Plugin Icon

Figma plugin icons are **not** set in `manifest.json` — there's no `icon`
field for regular plugins (that's only a thing for Figma *widgets*, which
this isn't). Instead, the icon is uploaded through Figma's own **Publish**
flow, so you set/change it entirely inside the Figma desktop app.

## Steps

1. Prepare a **128×128 PNG** (or JPG). Keep the design simple — it gets
   scaled down to ~24×24 in the Plugins panel, so fine detail disappears.
   Use a transparent or solid background depending on how you want it to
   sit against Figma's UI.
2. In the Figma desktop app, open **Plugins → Development → Export Pro**,
   then choose **Publish** (or, if you've already published it once, open
   the plugin's page and choose **Edit** / **Manage**).
3. In the publish dialog, click the icon/cover image area and upload your
   PNG.
4. Fill in / update the rest of the listing (name, description, cover
   image — a separate, larger image shown on the Community page) and
   submit.
5. The new icon shows up in the Plugins panel and on the Community listing
   once the update is processed.

## If you're not publishing (private/dev use only)

Locally-imported "Development" plugins (via **Import plugin from
manifest…**) show a generic default icon in the Plugins panel — there's no
way to set a custom one without going through the Publish flow at least
once. If you only ever run it locally, the icon doesn't really matter
beyond that generic placeholder.

## Where to keep the source icon file in this repo

There's no required location, but a common convention is:

```
docs/icon.png       128×128 source icon, uploaded manually during Publish
docs/cover.png       Larger cover image for the Community listing (Figma will tell you the current required size)
```

These aren't referenced by the build — they're just for you to keep on hand
so you're not hunting for the source file next time you update the listing.
