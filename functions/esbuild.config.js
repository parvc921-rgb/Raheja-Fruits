// Firebase only uploads the `functions/` directory for deployment — Cloud
// Build never sees the rest of this pnpm monorepo, so `functions/package.json`
// cannot depend on `@raheja/shared` via `workspace:*` (or any path outside
// `functions/`); a plain `npm install` on Cloud Build has no idea what that
// protocol means and fails with "Unsupported URL Type \"workspace:\"".
//
// The fix: don't ship @raheja/shared as a dependency at all. Bundle its
// source directly into lib/index.js at build time (this runs locally/in CI,
// with full access to the monorepo), so the deployed package.json only ever
// lists real, registry-resolvable npm packages.
const path = require("path");
const { build } = require("esbuild");

const sharedSrc = path.join(__dirname, "..", "packages", "shared", "src");

build({
  entryPoints: [path.join(__dirname, "src", "index.ts")],
  outfile: path.join(__dirname, "lib", "index.js"),
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  sourcemap: true,
  logLevel: "info",
  // Real npm packages: left external so Cloud Build's own `npm install`
  // fetches them normally from the registry — must also be listed in
  // functions/package.json's "dependencies" (not devDependencies).
  // firebase-admin/firebase-functions are large, native-binding-adjacent
  // SDKs meant to be installed normally, not bundled. zod/bcryptjs (pulled
  // in transitively via @raheja/shared) are pure JS and safe to inline —
  // bundling them avoids having to keep a second copy of their version
  // ranges in sync between here and packages/shared/package.json.
  external: ["firebase-admin", "firebase-functions"],
  // First-party workspace code: inlined, not installed. These specifiers
  // are the only two @raheja/shared entry points functions/src ever
  // imports (see index.ts and server.ts) — grep functions/src for
  // "@raheja/shared" before adding a new subpath here.
  alias: {
    "@raheja/shared": path.join(sharedSrc, "index.ts"),
    "@raheja/shared/server": path.join(sharedSrc, "server.ts"),
  },
}).catch((err) => {
  console.error(err);
  process.exit(1);
});
