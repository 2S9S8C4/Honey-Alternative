import * as esbuild from "esbuild";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const srcDir = path.join(rootDir, "src");

const watch = process.argv.includes("--watch");
const production = process.argv.includes("--production");

type Target = "chrome" | "firefox";
const targets: Target[] = ["chrome", "firefox"];

const entryPoints = {
  background: path.join(srcDir, "background/index.ts"),
  content: path.join(srcDir, "content/index.ts"),
  pageBridge: path.join(srcDir, "content/injected/pageBridge.ts"),
  popup: path.join(srcDir, "popup/popup.ts"),
  options: path.join(srcDir, "options/options.ts"),
};

async function buildManifest(target: Target, outDir: string) {
  const base = JSON.parse(
    await fs.readFile(path.join(__dirname, "manifest.base.json"), "utf8")
  );

  const background =
    target === "chrome"
      ? { service_worker: "background.js" }
      : { scripts: ["background.js"] };

  const extra =
    target === "firefox"
      ? {
          browser_specific_settings: {
            gecko: { id: "coupon-finder@example.com", strict_min_version: "109.0" },
          },
        }
      : {};

  const manifest = { ...base, background, ...extra };
  await fs.writeFile(
    path.join(outDir, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
}

async function copyStatic(outDir: string) {
  const staticFiles: [string, string][] = [
    ["src/popup/popup.html", "popup.html"],
    ["src/popup/popup.css", "popup.css"],
    ["src/options/options.html", "options.html"],
    ["src/options/options.css", "options.css"],
  ];
  for (const [from, to] of staticFiles) {
    await fs.copyFile(path.join(rootDir, from), path.join(outDir, to));
  }
}

async function run() {
  for (const target of targets) {
    const outDir = path.join(rootDir, "dist", target);
    await fs.mkdir(outDir, { recursive: true });
    await buildManifest(target, outDir);
    await copyStatic(outDir);
  }

  const buildOptions: esbuild.BuildOptions = {
    entryPoints,
    bundle: true,
    outdir: path.join(rootDir, "dist", "chrome"),
    format: "iife",
    target: "es2020",
    minify: production,
    sourcemap: !production,
    define: {
      "process.env.NODE_ENV": JSON.stringify(production ? "production" : "development"),
    },
  };

  if (watch) {
    const chromeCtx = await esbuild.context(buildOptions);
    const firefoxCtx = await esbuild.context({
      ...buildOptions,
      outdir: path.join(rootDir, "dist", "firefox"),
    });
    await Promise.all([chromeCtx.watch(), firefoxCtx.watch()]);
    console.log("Watching for changes (chrome + firefox)...");
  } else {
    await esbuild.build(buildOptions);
    await esbuild.build({
      ...buildOptions,
      outdir: path.join(rootDir, "dist", "firefox"),
    });
    console.log(`Build complete (${production ? "production" : "development"}).`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
