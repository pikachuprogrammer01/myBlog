// Put static-only config into dist/ so Vercel preview on gh-pages branch
// doesn't try to run "vite build" (which fails — gh-pages has no source code).
const fs = require("fs");
const path = require("path");

const dist = path.resolve(__dirname, "..", "dist");

const vercelJson = {
  version: 2,
  builds: [{ src: "**", use: "@vercel/static" }],
};

const packageJson = {
  name: "myblog-ghpages",
  private: true,
  scripts: { build: "echo done" },
};

fs.writeFileSync(path.join(dist, "vercel.json"), JSON.stringify(vercelJson, null, 2));
fs.writeFileSync(path.join(dist, "package.json"), JSON.stringify(packageJson, null, 2));
