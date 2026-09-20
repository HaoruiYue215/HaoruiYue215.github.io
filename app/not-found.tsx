import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[100dvh] max-w-[1400px] flex-col justify-center px-4 md:px-8">
      <p className="font-mono text-sm text-muted">404</p>
      <h1 className="mt-3 text-4xl font-medium tracking-tight text-ink">
        这一页不存在
      </h1>
      <Link
        href="/"
        className="mt-8 inline-flex h-11 w-fit items-center bg-accent px-5 text-[13px] font-medium text-accent-ink"
      >
        回到首页
      </Link>
    </main>
  );
}
