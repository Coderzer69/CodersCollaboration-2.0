"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";
import { NAV_LINKS, SITE } from "@/lib/site";
import { cn } from "@/lib/utils";
import { StartSessionButton } from "@/components/session/start-session-button";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      if (window.scrollY < 200) setActive("");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Scroll-spy: highlight the section crossing the middle of the viewport.
  useEffect(() => {
    const els = NAV_LINKS.map((l) => document.getElementById(l.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const mq = window.matchMedia("(min-width: 768px)");
    const onMq = () => mq.matches && setOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onMq);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onMq);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b pt-[env(safe-area-inset-top,0px)] transition-[background-color,border-color,backdrop-filter] duration-300 motion-reduce:transition-none",
        solid ? "border-line bg-bg/80 text-ink backdrop-blur-xl" : "border-transparent bg-transparent text-navy",
      )}
    >
      <nav aria-label="Main" className="mx-auto flex h-[72px] max-w-[1120px] items-center justify-between px-6">
        <a href="#main" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight" onClick={() => setOpen(false)}>
          <Image src="/logo.svg" alt="" width={28} height={28} priority />
          {SITE.name}
        </a>

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                aria-current={active === l.id ? "location" : undefined}
                className="relative block rounded-lg px-3 py-2 text-[15px] font-semibold opacity-80 transition-opacity hover:opacity-100 aria-[current]:opacity-100"
              >
                {l.label}
                {active === l.id && (
                  <motion.span layoutId="nav-indicator" className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-plum" transition={{ type: "spring", stiffness: 500, damping: 40 }} />
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <StartSessionButton size="sm" className="hidden sm:inline-flex">
            Start a session
          </StartSessionButton>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-lg md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X aria-hidden className="size-6" /> : <Menu aria-hidden className="size-6" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden border-t border-line md:hidden"
          >
            <ul className="mx-auto flex max-w-[1120px] flex-col gap-1 px-6 py-4">
              {NAV_LINKS.map((l, i) => (
                <motion.li key={l.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}>
                  <a
                    href={`#${l.id}`}
                    onClick={() => setOpen(false)}
                    aria-current={active === l.id ? "location" : undefined}
                    className="block rounded-lg px-3 py-3 text-lg font-semibold aria-[current]:bg-plum/15"
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
              <li className="pt-2">
                <StartSessionButton className="w-full">Start a session</StartSessionButton>
              </li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
