// Type declaration for the private vite alias that points at the real
// `buffer` package (see vite.config.ts and src/lib/buffer-polyfill.ts).
declare module "lamportpay-real-buffer" {
  export { Buffer } from "buffer";
  const bufferPackage: { Buffer: typeof import("buffer").Buffer };
  export default bufferPackage;
}
