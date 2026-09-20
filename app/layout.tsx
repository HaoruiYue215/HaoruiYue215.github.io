import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC } from "next/font/google";
import { person } from "@/lib/content";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const noto = Noto_Sans_SC({
  variable: "--font-noto",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(person.site),
  title: {
    default: `${person.nameZh} ${person.nameEn}`,
    template: `%s · ${person.nameZh}`,
  },
  description:
    "AI 产品经理。建筑学出身，香港大学地理空间数据科学。360、货拉拉、网易有道、小红书。",
  authors: [{ name: person.nameEn }],
  openGraph: {
    title: `${person.nameZh} · ${person.role}`,
    description: "从图纸到产品。建筑训练，数据科学，AI 与交易产品。",
    url: person.site,
    siteName: person.nameEn,
    locale: "zh_CN",
    type: "website",
    images: [{ url: "/images/hero-studio.jpg", width: 1376, height: 768 }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${person.nameZh} · ${person.role}`,
    images: ["/images/hero-studio.jpg"],
  },
  icons: { icon: "/favicon.svg" },
};

const themeBoot = `try{var t=localStorage.getItem('hy-theme');var d=t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${noto.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className="min-h-[100dvh] bg-bg font-sans text-ink">
        {children}
      </body>
    </html>
  );
}
