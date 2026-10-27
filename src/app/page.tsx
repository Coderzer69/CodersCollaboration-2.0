import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { CtaBand, Faq, Features, Footer, HowItWorks, UseCases } from "@/components/site/sections";

export default function Home() {
  return (
    <>
      <Navbar />
      <main id="main">
        <Hero />
        <Features />
        <UseCases />
        <HowItWorks />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
