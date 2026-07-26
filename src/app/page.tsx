// src/app/page.tsx
import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { About } from "@/components/landing/about";
import { WhyUs } from "@/components/landing/why-us";
import { Features } from "@/components/landing/features";
import { Stats } from "@/components/landing/stats";
import { Quote } from "@/components/landing/quote";
import { Contact } from "@/components/landing/contact";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <About />
        <WhyUs />
        <Features />
        <Stats />
        <Quote />
        <Contact />
      </main>
      <Footer />
    </div>
  );
}