import { defineConfig, loadEnv } from "vite";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";

// rpc-websockets (pulled in by @solana/web3.js) only declares "browser"/"node"
// export conditions, neither of which the SSR build matches. Resolve it
// to the browser build file directly so bundling succeeds in every environment.
const rpcWebsocketsBrowser = fileURLToPath(
  new URL("./node_modules/rpc-websockets/dist/index.browser.mjs", import.meta.url),
);
const browserBufferShim = fileURLToPath(new URL("./src/lib/buffer-polyfill.ts", import.meta.url));
// The real `buffer` package file, imported by the polyfill under a private
// name ("lamportpay-real-buffer") that Nitro/unenv never re-alias. Nitro's
// Cloudflare preset rewrites "buffer/index.js" to a minimal mock AFTER our
// alias-cleanup plugin runs, which made the polyfill fall back to its shim
// and broke wallet signing in the Lovable preview ("writeUIntLE is not a
// function", 11 Oct 2026).
const realBufferPackage = fileURLToPath(
  new URL("./node_modules/buffer/index.js", import.meta.url),
);
// Server-side stand-in for that package. The real `buffer` package is CommonJS
// and does require("base64-js")/require("ieee754"); bundled for the edge runtime
// those become createRequire() calls the worker cannot resolve, so the SSR entry
// threw "No such module base64-js" at import time and every page returned 500
// (found 11 Oct 2026, right after publishing to the main domain).
const bufferServerStub = fileURLToPath(
  new URL("./src/lib/buffer-server-buffer.ts", import.meta.url),
);

// Dev-only virtual module: node_modules/buffer/index.js is CommonJS, and Vite
// serves that file raw (no exports at all) when it is reached by path. The
// bridge imports the pre-bundled ESM copy instead, so the polyfill's default
// import gets the real package in the preview too.
const bufferDevBridge = "\0lamportpay-buffer-dev";

// @solana-mobile/wallet-adapter-mobile (pulled in by @solana/wallet-adapter-react)
// calls Node's util.inherits at module scope, which throws in the SSR runtime
// and 500s every server-rendered page. It is browser-only code, so stub it for
// SSR while the real module stays in the client bundle.
const solanaMobileSsrStub = fileURLToPath(
  new URL("./src/lib/solana-mobile-ssr-stub.ts", import.meta.url),
);

// Public (publishable) backend connection values. `.env` is gitignored, so a
// build made from a clean checkout (the published site, Vercel, CI) has no
// VITE_SUPABASE_* values and the browser app crashes with "Missing Supabase
// environment variable(s)". These are publishable, not secrets; a local or
// hosting-provided env value always wins over them.
const PUBLIC_BACKEND_DEFAULTS: Record<string, string> = {
  VITE_SUPABASE_URL: "https://zmcbnknjatrfwrcfvtzt.supabase.co",
  VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_9e5G0Zw8rj0IQzv9Oos7Yw_UdccFnBL",
  VITE_SUPABASE_PROJECT_ID: "zmcbnknjatrfwrcfvtzt",
};

export default defineConfig(({ command, mode }) => {
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const viteEnv: Record<string, string> = { ...loadedEnv };
  for (const [key, value] of Object.entries(PUBLIC_BACKEND_DEFAULTS)) {
    if (!viteEnv[key]) viteEnv[key] = value;
  }
  const envDefine = Object.fromEntries(
    Object.entries(viteEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  // Dev server: `buffer` is CommonJS, so the browser has to receive it through
  // Vite's dependency pre-bundler (see optimizeDeps.include below). Serving
  // node_modules/buffer/index.js raw hands the browser a module with no exports.
  const isDevServer = command === "serve";

  return {
    define: envDefine,
    css: { transformer: "lightningcss" },
    // strictPort: Supabase auth redirect URLs are registered for :8080.
    server: { host: "::", port: 8080, strictPort: true },
    resolve: {
      alias: [
        { find: /^@\//, replacement: fileURLToPath(new URL("./src/", import.meta.url)) },
        { find: /^rpc-websockets$/, replacement: rpcWebsocketsBrowser },
        { find: /^rpc-websockets\/dist\/lib\/client$/, replacement: rpcWebsocketsBrowser },
        // Buffer specifiers are resolved by the "lamportpay-node-buffer-browser-shim"
        // plugin below instead of an alias: an alias cannot tell the browser build
        // from the server build, and sending the browser package into the server
        // bundle is what took the published site down (500 on every route).
      ],
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "buffer",
      ],
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      {
        name: "lamportpay-solana-mobile-ssr-stub",
        enforce: "pre",
        resolveId(id, _importer, options) {
          if (options?.ssr && id.startsWith("@solana-mobile/wallet-adapter-mobile")) {
            return solanaMobileSsrStub;
          }
          return null;
        },
      },
      {
        // Nitro adds "buffer/", "buffer/index" and "buffer/index.js" -> "node:buffer"
        // aliases to every build, the browser one included. With the aliases below
        // that sent buffer-polyfill.ts's own import of the real `buffer` package back
        // to the polyfill itself: it loaded nothing, fell back to its minimal shim,
        // and every wallet signature on Vercel failed with "writeUIntLE is not a
        // function" (8 Oct 2026; dev has no Nitro, so localhost worked). Drop them:
        // the server resolves Buffer from Node either way.
        name: "lamportpay-drop-nitro-buffer-aliases",
        enforce: "post",
        configResolved(resolved) {
          const nitroBufferAlias = new Set(["buffer/", "buffer/index", "buffer/index.js"]);
          const aliases = resolved.resolve.alias as Array<{ find: string | RegExp }>;
          for (let i = aliases.length - 1; i >= 0; i--) {
            const find = aliases[i]!.find;
            if (typeof find === "string" && nitroBufferAlias.has(find)) aliases.splice(i, 1);
          }
        },
      },
      {
        name: "lamportpay-node-buffer-browser-shim",
        enforce: "pre",
        // Sole resolver for Buffer: the browser gets the real `buffer` package
        // (web3.js needs the full API to serialize a transaction), the server
        // gets Node's own Buffer through src/lib/buffer-server-buffer.ts.
        resolveId(id, _importer, options) {
          if (id === bufferDevBridge) return bufferDevBridge;
          if (id === "lamportpay-real-buffer") {
            if (options?.ssr) return bufferServerStub;
            // Dev: the package file is CommonJS and Vite serves it raw, so the
            // browser gets the ESM bridge over the pre-bundled copy instead.
            if (isDevServer) return bufferDevBridge;
            return realBufferPackage;
          }
          if (id === "buffer" || id === "buffer/") {
            if (options?.ssr) return bufferServerStub;
            // Dev: let Vite pre-bundle the real package (optimizeDeps.include)
            // so the bridge can import it; the build keeps the polyfill shim.
            if (isDevServer) return null;
            return browserBufferShim;
          }
          // node:buffer stays native on the server: that is what the stub re-exports.
          if (id === "node:buffer" && !options?.ssr) return browserBufferShim;
          return null;
        },
        load(id) {
          if (id !== bufferDevBridge) return null;
          return [
            'import bufferPkg from "buffer";',
            "const Buffer = bufferPkg.Buffer ?? bufferPkg;",
            "export { Buffer };",
            "export default { Buffer };",
          ].join("\n");
        },
      },
      tanstackStart({
        // Use src/server.ts (our SSR error wrapper) as the server entry.
        server: { entry: "server" },
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
      }),
      // Nitro only runs for production builds. Preset defaults to "vercel";
      // override with NITRO_PRESET (e.g. "node-server") for other targets.
      // NITRO_NO_EXTERNALS=1 bundles all deps instead of tracing node_modules,
      // which works around a Windows-only EISDIR error in the file tracer.
      // Vercel Cron runs payment reconciliation (it sends CRON_SECRET as a
      // bearer token). Daily by default because Hobby plans reject anything
      // more frequent; set RECONCILE_CRON_SCHEDULE (e.g. "*/10 * * * *") on Pro.
      ...(command === "build"
        ? [
            nitro(
              // Lovable's publish pipeline deploys dist/ as a Cloudflare worker;
              // everywhere else (Vercel, local) keeps the Vercel preset.
              process.env.LOVABLE_SANDBOX === "1" || process.env.DEV_SERVER__PROJECT_PATH
                ? {
                    preset: "cloudflare-module",
                    noExternals: true,
                    output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
                    cloudflare: { nodeCompat: true, deployConfig: true },
                  }
                : {
              preset: process.env.NITRO_PRESET || "vercel",
              noExternals: process.env.NITRO_NO_EXTERNALS === "1",
              vercel: {
                config: {
                  version: 3,
                  crons: [
                    {
                      path: "/api/cron/reconcile-payments",
                      schedule: process.env.RECONCILE_CRON_SCHEDULE || "0 5 * * *",
                    },
                  ],
                },
              },
                  },
            ),
          ]
        : []),
      viteReact(),
    ],
  };
});
