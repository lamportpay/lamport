import { useEffect, useRef, useState } from "react";

/** Presentation-only playback; never represents payment or verification state. */
export function useFlowPlayback(count: number, initial = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(initial);
  const [inView, setInView] = useState(false);
  const playing = true;
  const [reduced, setReduced] = useState(false);
  const [focused, setFocused] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener("change", update);
    const el = ref.current;
    const observer = new IntersectionObserver(([entry]) => setInView(Boolean(entry?.isIntersecting)), { threshold: 0.15 });
    if (el) observer.observe(el);
    return () => { observer.disconnect(); media.removeEventListener("change", update); };
  }, []);
  const pick = (value: number) => {
    setActive((value + count) % count);
  };
  return { ref, active, inView, playing, reduced, pick,
    focusProps: {
      onFocusCapture: () => setFocused(true),
      onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      },
    },
  };
}