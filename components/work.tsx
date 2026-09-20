"use client";

import { works } from "@/lib/content";
import { ArrowUpRight } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useState } from "react";
import { Reveal } from "./reveal";

export function Work() {
  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();
  const current = works[active] ?? works[0];

  return (
    <section id="work" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <h2 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">
          精选工作
        </h2>
      </Reveal>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <ul>
            {works.map((work, i) => {
              const selected = i === active;
              return (
                <li key={work.id} className="border-b border-line last:border-b-0">
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    onMouseEnter={() => {
                      if (window.matchMedia("(min-width: 1024px)").matches) {
                        setActive(i);
                      }
                    }}
                    className={`flex w-full items-baseline justify-between gap-4 py-5 text-left transition-colors duration-200 ${
                      selected ? "text-ink" : "text-muted hover:text-ink"
                    }`}
                    aria-current={selected ? "true" : undefined}
                  >
                    <span className="min-w-0">
                      <span className="block text-[17px] font-medium tracking-tight">
                        {work.company}
                      </span>
                      <span className="mt-1 block text-[13px]">
                        {work.role} · {work.unit}
                      </span>
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-muted">
                      {work.dates}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="lg:col-span-7">
          <div className="relative aspect-[4/3] overflow-hidden bg-tint">
            {works.map((work, i) => (
              <motion.div
                key={work.id}
                className="absolute inset-0"
                initial={false}
                animate={{ opacity: i === active ? 1 : 0 }}
                transition={{ duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
                style={{ pointerEvents: i === active ? "auto" : "none" }}
              >
                <Image
                  src={work.image}
                  alt={work.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  className="object-cover"
                  priority={i === 0}
                />
              </motion.div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={current.id + "-copy"}
              className="mt-6"
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-2xl font-medium tracking-tight text-ink">
                  {current.title}
                </h3>
                <ArrowUpRight
                  size={18}
                  className="mt-1 shrink-0 text-accent"
                  weight="regular"
                />
              </div>
              <p className="mt-3 max-w-[65ch] text-base leading-relaxed text-muted">
                {current.body}
              </p>
              <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                {current.stats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="text-[12px] text-muted">{stat.label}</dt>
                    <dd className="mt-1 font-mono text-2xl tracking-tight text-ink">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
