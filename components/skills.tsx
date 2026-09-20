import { skills } from "@/lib/content";
import Image from "next/image";
import { Reveal } from "./reveal";

export function Skills() {
  return (
    <section id="skills" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <h2 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
          能做什么
        </h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-px bg-line md:grid-cols-12">
        {skills.map((skill, i) => {
          const accent = "accent" in skill && skill.accent;
          const tall = "tall" in skill && skill.tall;
          const image = "image" in skill ? skill.image : undefined;
          const imageAlt = "imageAlt" in skill ? skill.imageAlt : "";
          const onPhoto = Boolean(image);

          return (
            <Reveal
              key={skill.id}
              delay={i * 0.05}
              className={`h-full bg-bg ${skill.span}`}
            >
              <article
                className={`relative flex h-full min-h-[220px] flex-col justify-end overflow-hidden p-6 md:p-8 ${
                  tall ? "md:min-h-[480px]" : "md:min-h-[240px]"
                } ${accent ? "bg-accent" : "bg-bg-elev"}`}
              >
                {image ? (
                  <>
                    <Image
                      src={image}
                      alt={imageAlt ?? ""}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[#1c1f24]/62" aria-hidden />
                  </>
                ) : null}
                <div className="relative">
                  <h3
                    className={`text-xl font-medium tracking-tight ${
                      onPhoto ? "text-[#fff6f2]" : accent ? "text-accent-ink" : "text-ink"
                    }`}
                  >
                    {skill.title}
                  </h3>
                  <p
                    className={`mt-3 max-w-[42ch] text-sm leading-relaxed ${
                      onPhoto
                        ? "text-[#fff6f2]/85"
                        : accent
                          ? "text-accent-ink/85"
                          : "text-muted"
                    }`}
                  >
                    {skill.body}
                  </p>
                </div>
              </article>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
