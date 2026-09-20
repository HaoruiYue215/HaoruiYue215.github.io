"use client";

import { person } from "@/lib/content";
import { ArrowRight, EnvelopeSimple } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

export function Hero() {
  const reduce = useReducedMotion();

  return (
    <section
      id="top"
      className="mx-auto grid max-w-[1400px] grid-cols-1 items-start gap-8 px-4 pb-12 pt-10 md:px-8 lg:grid-cols-12 lg:min-h-[calc(100dvh-4rem)] lg:items-center lg:gap-10 lg:py-10"
    >
      <div className="lg:col-span-6">
        <motion.p
          className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted"
          initial={reduce ? false : { y: 10 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {person.nameEn} · {person.role}
        </motion.p>
        <motion.h1
          className="mt-4 max-w-[12ch] text-5xl font-medium leading-[1.1] tracking-tighter text-ink pb-1 md:text-6xl lg:text-7xl"
          initial={reduce ? false : { y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
        >
          从图纸到产品
        </motion.h1>
        <motion.p
          className="mt-5 max-w-[36ch] text-base leading-relaxed text-muted"
          initial={reduce ? false : { y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          建筑五年，现在港大读地理空间数据科学。做过 360、货拉拉、有道和小红书。
        </motion.p>
        <motion.div
          className="mt-8 flex flex-wrap items-center gap-3"
          initial={reduce ? false : { y: 12 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          <a
            href="#contact"
            className="inline-flex h-11 items-center gap-2 bg-accent px-5 text-[13px] font-medium text-accent-ink transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            发邮件
            <EnvelopeSimple size={16} weight="regular" />
          </a>
          <a
            href="#work"
            className="inline-flex h-11 items-center gap-2 border border-ink px-5 text-[13px] font-medium text-ink transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-ink hover:text-bg active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            精选工作
            <ArrowRight size={16} weight="regular" />
          </a>
        </motion.div>
      </div>

      <motion.div
        className="relative aspect-[4/3] w-full overflow-hidden bg-tint lg:col-span-6 lg:aspect-auto lg:h-[calc(100dvh-10rem)]"
        initial={reduce ? false : { y: 16 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image
          src="/images/hero-studio.jpg"
          alt="混凝土工作室里的绘图桌和窗外天光"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />
      </motion.div>
    </section>
  );
}
