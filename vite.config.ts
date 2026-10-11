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

// @solana-mobile/wallet-adapter-mobile (pulled in by @solana/wallet-adapter-react)
// calls Node's util.inherits at module scope, which throws in the SSR runtime
// and 500s every server-rendered page. It is browser-only code, so stub it for
// SSR while the real module stays in the client bundle.
const solanaMobileSsrStub = fileURLToPath(
  new URL("./src/lib/solana-mobile-ssr-stub.ts", import.meta.url),
);

export default defineConfig(({ command, mode }) => {
  const viteEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(viteEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

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
        { find: /^node:buffer$/, replacement: browserBufferShim },
        { find: /^buffer$/, replacement: browserBufferShim },
        { find: /^buffer\/$/, replacement: browserBufferShim },
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
      include: ["react", "react-dom", "react-dom/client", "react/jsx-runtime", "react/jsx-dev-runtime"],
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
        resolveId(id) {
          if (id === "node:buffer" || id === "buffer" || id === "buffer/") return browserBufferShim;
          return null;
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
      // Nitro only runs for production builds. The build always packages as a
      // Cloudflare worker into dist/ — the single deploy target (Lovable).
      // Vercel deployment was removed (owner decision, 2026-10-11): testing
      // happens in the Lovable preview, then push to GitHub, then publish to
      // the main domain. Payment reconciliation runs on the backend scheduler
      // (pg_cron every 5 min), not on a hosting cron.
      ...(command === "build"
        ? [
            nitro({
              preset: "cloudflare-module",
              noExternals: true,
              output: { dir: "dist", serverDir: "dist/server", publicDir: "dist/client" },
              cloudflare: { nodeCompat: true, deployConfig: true },
            }),
          ]
        : []),
      viteReact(),
    ],
  };
});
