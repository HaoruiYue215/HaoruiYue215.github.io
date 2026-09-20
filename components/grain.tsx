import { Z } from "@/lib/z-index";

export function Grain() {
  return <div className="grain" style={{ zIndex: Z.grain }} aria-hidden />;
}
