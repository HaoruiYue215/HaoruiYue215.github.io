import { studio } from "@/lib/content";
import Image from "next/image";
import { Reveal } from "./reveal";

export function Studio() {
  return (
    <section id="studio" className="py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-4 md:px-8">
        <Reveal>
          <h2 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
            {studio.title}
          </h2>
          <p className="mt-2 font-mono text-[13px] text-muted">{studio.handle}</p>
          <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-muted">
            {studio.body}
          </p>
        </Reveal>
      </div>

      <Reveal delay={0.08} className="mt-10">
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-tint">
          <Image
            src={studio.image}
            alt={studio.imageAlt}
            fill
            sizes="100vw"
            className="object-cover"
          />
        </div>
      </Reveal>

      <div className="mx-auto mt-10 grid max-w-[1400px] grid-cols-1 gap-8 px-4 md:grid-cols-3 md:px-8">
        {studio.stats.map((stat, i) => (
          <Reveal key={stat.label} delay={i * 0.05}>
            <p className="font-mono text-4xl tracking-tight text-ink md:text-5xl">
              {stat.value}
            </p>
            <p className="mt-2 text-sm text-muted">{stat.label}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
