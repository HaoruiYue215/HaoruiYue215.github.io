import { education } from "@/lib/content";
import Image from "next/image";
import { Reveal } from "./reveal";

export function About() {
  return (
    <section id="about" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <h2 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
          先看结构
        </h2>
        <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-muted">
          本科五年建筑学，习惯先读场地和约束，再落一笔。现在香港大学读地理空间数据科学，把同一套严谨用到
          AI 与交易产品上。蓝图在前，再开工。
        </p>
      </Reveal>

      <Reveal delay={0.08} className="mt-12">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-tint md:aspect-[16/9]">
          <Image
            src="/images/about-model.jpg"
            alt="俯拍的四合院体块研究模型"
            fill
            sizes="(max-width: 1400px) 100vw, 1400px"
            className="object-cover"
          />
        </div>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-2">
        {education.map((item, i) => (
          <Reveal key={item.school} delay={i * 0.06}>
            <p className="font-mono text-[12px] text-muted">{item.dates}</p>
            <h3 className="mt-2 text-xl font-medium tracking-tight text-ink">
              {item.school}
            </h3>
            <p className="mt-1 text-sm text-muted">{item.schoolEn}</p>
            <p className="mt-3 text-base text-ink">{item.program}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
