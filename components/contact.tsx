"use client";

import { person } from "@/lib/content";
import { Check, Copy, EnvelopeSimple } from "@phosphor-icons/react";
import { useState } from "react";
import { Reveal } from "./reveal";

type Status = "idle" | "error" | "sent";

export function Contact() {
  const [status, setStatus] = useState<Status>("idle");
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; message?: string }>(
    {},
  );

  function validate(form: FormData) {
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const message = String(form.get("message") ?? "").trim();
    const next: typeof errors = {};
    if (!name) next.name = "请填写姓名。";
    if (!email) next.email = "请填写邮箱。";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "邮箱格式不对。";
    if (!message) next.message = "请写一两句想聊的事。";
    else if (message.length < 6) next.message = "再写具体一点，至少一句话。";
    return { name, email, message, next };
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { name, email, message, next } = validate(form);
    setErrors(next);
    if (Object.keys(next).length) {
      setStatus("error");
      return;
    }

    const subject = encodeURIComponent(`网站来信 · ${name}`);
    const body = encodeURIComponent(`${message}\n\n来自：${name} <${email}>`);
    window.location.href = `mailto:${person.email}?subject=${subject}&body=${body}`;
    setStatus("sent");
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(person.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-32">
      <Reveal>
        <h2 className="text-3xl font-medium tracking-tight text-ink md:text-4xl">发邮件</h2>
        <p className="mt-5 max-w-[65ch] text-base leading-relaxed text-muted">
          写清公司和想聊的角色。我会用邮件回复。
        </p>
      </Reveal>

      <Reveal delay={0.08} className="mt-10 max-w-xl">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm text-ink">
              姓名
            </label>
            <input
              id="name"
              name="name"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : "name-help"}
              className="h-11 border border-line bg-bg-elev px-3 text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              placeholder="怎么称呼"
            />
            <p id="name-help" className="text-[12px] text-muted">
              真名或常用名都可以。
            </p>
            {errors.name ? (
              <p id="name-error" className="text-[12px] text-accent">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm text-ink">
              邮箱
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className="h-11 border border-line bg-bg-elev px-3 text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              placeholder="you@company.com"
            />
            {errors.email ? (
              <p id="email-error" className="text-[12px] text-accent">
                {errors.email}
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="message" className="text-sm text-ink">
              想聊什么
            </label>
            <textarea
              id="message"
              name="message"
              rows={5}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "message-error" : "message-help"}
              className="border border-line bg-bg-elev px-3 py-3 text-ink placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              placeholder="岗位、项目，或你想核实的一段经历"
            />
            <p id="message-help" className="text-[12px] text-muted">
              会打开你的邮箱软件，预填收件人。
            </p>
            {errors.message ? (
              <p id="message-error" className="text-[12px] text-accent">
                {errors.message}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex h-11 items-center gap-2 bg-accent px-5 text-[13px] font-medium text-accent-ink transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] hover:brightness-110 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              发邮件
              <EnvelopeSimple size={16} />
            </button>
            <button
              type="button"
              onClick={copyEmail}
              className="inline-flex h-11 items-center gap-2 border border-ink px-5 text-[13px] font-medium text-ink transition-transform duration-200 hover:bg-ink hover:text-bg active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "已复制" : "复制邮箱"}
            </button>
          </div>

          {status === "sent" ? (
            <p className="text-sm text-ink" role="status">
              如果邮箱没有打开，请直接写到 {person.email}
            </p>
          ) : null}
          {status === "error" ? (
            <p className="text-sm text-accent" role="alert">
              请先改红字提示，再发送。
            </p>
          ) : null}
        </form>

        <p className="mt-8 text-sm text-muted">
          {person.email}
          <span className="mx-2 text-line">/</span>
          {person.phone}
        </p>
      </Reveal>
    </section>
  );
}
