/* global process */
import esbuild from "esbuild";

const production = process.argv.includes("production");

await esbuild.build({
  entryPoints: ["src/main.ts"],
  outfile: "build/bootstrap.js",
  bundle: true,
  platform: "browser",
  format: "esm",
  target: ["firefox115"],
  minify: production,
  sourcemap: !production,
  jsx: "automatic",
  external: [],
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      production ? "production" : "development",
    ),
  },
});
