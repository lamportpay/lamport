import { Landmark } from "lucide-react";
import logos from "@/assets/banks/official-bank-logos.png.asset.json";
import registry from "@/lib/bank-logo-registry.json";

const banks: Record<string, Record<string, number[]>> = registry;

/** Official-site brand icons, with a neutral fallback when no verified image is available. */
export function BankIcon({ name, country }: { name: string; country: string }) {
  const position = banks[country]?.[name];
  const [x, y] = position ?? [];
  return (
    <span aria-hidden="true" className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded bg-card text-muted-foreground">
      {x !== undefined && y !== undefined ? (
        <span className="block h-6 w-6 bg-no-repeat" style={{ backgroundImage: `url(${logos.url})`, backgroundSize: "384px auto", backgroundPosition: `-${x * 0.375}px -${y * 0.375}px` }} />
      ) : <Landmark className="h-4 w-4" />}
    </span>
  );
}