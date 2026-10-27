import Image from "next/image";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { StartSessionButton } from "@/components/session/start-session-button";
import { FAQS, FEATURES, STEPS, USE_CASES } from "@/lib/content";
import { NAV_LINKS, SITE } from "@/lib/site";
import { Reveal } from "./reveal";

function Heading({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2 className="mb-3.5 max-w-[16ch] text-[clamp(32px,4.4vw,54px)] font-extrabold leading-[1.04] tracking-[-0.03em]">{title}</h2>
      <p className="mb-12 max-w-[52ch] text-mute">{sub}</p>
    </>
  );
}

const wrap = "mx-auto max-w-[1120px] px-6";

export function Features() {
  return (
    <section id="features" className="py-24">
      <div className={wrap}>
        <Reveal>
          <Heading title="Everything you need to pair." sub="A small, fast editor with the pieces that matter when two people look at the same code." />
        </Reveal>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }, i) => (
            <li key={title}>
              <Reveal delay={0.05 * (i % 3)} className="h-full">
                <div className="h-full rounded-[20px] border border-line bg-surface p-7">
                  <span className="mb-5 grid size-11 place-items-center rounded-xl bg-peach text-navy">
                    <Icon aria-hidden className="size-5" />
                  </span>
                  <h3 className="mb-1.5 text-[22px] font-bold tracking-tight">{title}</h3>
                  <p className="text-mute">{body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function UseCases() {
  return (
    <section id="use-cases" className="pb-24">
      <div className={wrap}>
        <Reveal>
          <Heading title="One editor, three ways to use it." sub="Whenever two people need to look at the same code, send a link instead of a screenshot." />
        </Reveal>
        <ul>
          {USE_CASES.map(({ icon: Icon, title, body }) => (
            <li key={title} className="grid gap-1.5 border-t border-line py-7 last:border-b md:grid-cols-[minmax(150px,0.7fr)_2fr] md:gap-6">
              <h3 className="flex items-center gap-3 text-[26px] font-bold tracking-tight">
                <Icon aria-hidden className="size-6 text-plum" />
                {title}
              </h3>
              <p className="max-w-[56ch] text-mute">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

const STEP_COLORS = ["bg-rose", "bg-peach", "bg-butter"];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="pb-24">
      <div className={wrap}>
        <Reveal>
          <Heading title="Up and running in three steps." sub="There is nothing to install." />
        </Reveal>
        <ol className="grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <Reveal delay={0.08 * i} className="h-full">
                <div className="h-full rounded-[20px] border border-line bg-surface p-7">
                  <span className={`mb-[18px] grid size-[42px] place-items-center rounded-full font-extrabold text-navy ${STEP_COLORS[i]}`}>{i + 1}</span>
                  <h3 className="mb-1.5 text-[22px] font-bold">{s.title}</h3>
                  <p className="text-mute">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section id="faq" className="pb-24">
      <div className={`${wrap} max-w-[860px]`}>
        <Reveal>
          <Heading title="Questions, answered." sub="The short version of what people ask before their first session." />
        </Reveal>
        <Accordion type="single" collapsible>
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q${i}`}>
              <AccordionTrigger>{f.q}</AccordionTrigger>
              <AccordionContent>{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

export function CtaBand() {
  return (
    <section aria-labelledby="cta-title" className="brand-gradient-band mx-6 mb-6 rounded-[28px] px-6 py-[90px] text-center text-navy">
      <h2 id="cta-title" className="mx-auto mb-6 max-w-[14ch] text-[clamp(32px,4.4vw,54px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
        Your next pairing session is one click away.
      </h2>
      <StartSessionButton size="lg">Start a session</StartSessionButton>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="py-8 pb-10 text-[15px] text-mute">
      <div className={`${wrap} flex flex-wrap items-center justify-between gap-x-8 gap-y-4`}>
        <a href="#main" className="flex items-center gap-2 font-bold text-ink">
          <Image src="/logo.svg" alt="" width={22} height={22} />
          {SITE.name}
        </a>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {NAV_LINKS.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className="hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <p>© 2026 {SITE.name}. Built for developers who work better together.</p>
      </div>
    </footer>
  );
}
