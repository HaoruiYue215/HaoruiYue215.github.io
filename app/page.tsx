import { About } from "@/components/about";
import { Contact } from "@/components/contact";
import { Footer } from "@/components/footer";
import { Grain } from "@/components/grain";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { Skills } from "@/components/skills";
import { Studio } from "@/components/studio";
import { Work } from "@/components/work";
import { person } from "@/lib/content";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: person.nameEn,
  alternateName: person.nameZh,
  jobTitle: person.role,
  email: person.email,
  telephone: person.phone,
  url: person.site,
  sameAs: [person.github],
  alumniOf: [
    { "@type": "CollegeOrUniversity", name: "The University of Hong Kong" },
    {
      "@type": "CollegeOrUniversity",
      name: "Xi'an University of Architecture and Technology",
    },
  ],
};

export default function Home() {
  return (
    <>
      <a
        href="#work"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-ink"
      >
        跳到精选工作
      </a>
      <Grain />
      <Nav />
      <main>
        <Hero />
        <Work />
        <About />
        <Skills />
        <Studio />
        <Contact />
      </main>
      <Footer />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
