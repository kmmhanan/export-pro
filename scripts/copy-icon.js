const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "../docs/icon.png");
const dest = path.join(__dirname, "../dist/icon.png");

fs.copyFileSync(src, dest);
console.log("Icon copied to dist/icon.png");
