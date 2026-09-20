"use client";

import { person } from "@/lib/content";
import { ArrowUpRight } from "@phosphor-icons/react";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-8">
        <p className="text-sm text-muted">
          {person.nameZh} / {person.nameEn}
        </p>
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <a
            href={`mailto:${person.email}`}
            className="inline-flex items-center gap-1 text-ink hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            发邮件
            <ArrowUpRight size={14} />
          </a>
          <a
            href={person.resume}
            className="inline-flex items-center gap-1 text-ink hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            下载简历
            <ArrowUpRight size={14} />
          </a>
          <a
            href={person.github}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-ink hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            GitHub
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </footer>
  );
}
