// Server-side (SSR / edge) stand-in for the browser `buffer` package.
//
// vite.config.ts resolves "lamportpay-real-buffer", "buffer" and "buffer/" to
// this file when building the server bundle. The real `buffer` package is
// CommonJS and does require("base64-js") / require("ieee754"); when it is
// bundled for the edge runtime those requires become createRequire() calls that
// the worker cannot resolve, so the SSR entry threw "No such module
// base64-js" at import time and EVERY server-rendered page returned 500
// (found 11 Oct 2026, right after publishing to the main domain).
//
// The server runtime already provides Node's Buffer natively, so re-export it
// instead of bundling the browser package. Keep this file free of any other
// import: "node:buffer" must resolve natively, never back through the alias.
export { Buffer } from "node:buffer";
export * from "node:buffer";

export default { Buffer };
