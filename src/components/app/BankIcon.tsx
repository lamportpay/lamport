import { Landmark } from "lucide-react";
import logos from "@/assets/banks/official-bank-logos.png.asset.json";
import registry from "@/lib/bank-logo-registry.json";

const banks: Record<string, Record<string, number[]>> = registry;

/** Official-site brand icons, with a neutral fallback when no verified image is available. */
export function BankIcon({ name, country, size = 32 }: { name: string; country: string; size?: number }) {
  // Sprite tiles are 64px squares in a 1024px-wide sheet.
  const scale = size / 64;
  const position = banks[country]?.[name];
  const [x, y] = position ?? [];
  return (
    <span aria-hidden="true" className="grid shrink-0 place-items-center overflow-hidden rounded-full bg-card text-muted-foreground ring-1 ring-border/60 shadow-sm" style={{ width: size, height: size }}>
      {x !== undefined && y !== undefined ? (
        <span className="block bg-no-repeat" style={{ width: size, height: size, backgroundImage: `url(${logos.url})`, backgroundSize: `${1024 * scale}px auto`, backgroundPosition: `-${x * scale}px -${y * scale}px` }} />
      ) : <Landmark style={{ width: size * 0.5, height: size * 0.5 }} />}
    </span>
  );
}