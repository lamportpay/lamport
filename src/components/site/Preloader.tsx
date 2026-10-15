import { useEffect, useState } from "react";

/**
 * Branded preloader shown once per browser session on the first page load.
 * Fades out after the window finishes loading (minimum 900ms, maximum 2.5s)
 * so fast loads still feel intentional and slow loads never hang on it.
 */
export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (window.sessionStorage.getItem("lp-preloader-seen")) {
      setVisible(false);
      return;
    }
    window.sessionStorage.setItem("lp-preloader-seen", "1");

    const started = Date.now();
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      const elapsed = Date.now() - started;
      const wait = Math.max(0, 900 - elapsed);
      window.setTimeout(() => {
        setLeaving(true);
        window.setTimeout(() => setVisible(false), 450);
      }, wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      // Safety net: never block the page longer than 2.5s.
      window.setTimeout(finish, 2500);
    }
    return () => window.removeEventListener("load", finish);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      data-preloader
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background transition-opacity duration-500 ${
        leaving ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 animate-[spin_3s_linear_infinite] rounded-full border-2 border-transparent border-t-primary border-r-violet-500 motion-reduce:animate-none" />
        <span className="absolute inset-2 animate-[spin_2s_linear_infinite_reverse] rounded-full border-2 border-transparent border-b-primary/70 motion-reduce:animate-none" />
        <span className="bg-gradient-to-br from-primary to-violet-600 bg-clip-text text-3xl font-bold text-transparent">
          L
        </span>
      </div>
      <p className="mt-6 bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-lg font-semibold tracking-wide text-transparent">
        LamportPay
      </p>
      <p className="mt-1 text-xs tracking-widest text-muted-foreground uppercase">
        Crypto in. Local money out.
      </p>
    </div>
  );
}
