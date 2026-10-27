"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Kind = "k" | "s" | "f" | "c" | "p";
type Who = "a" | "o";

const TOKEN_CLASS: Record<Kind, string> = { k: "text-[#c69bf0]", s: "text-[#f4b48e]", f: "text-[#8fd3b6]", c: "text-[#6c7196]", p: "" };

const LINES: { who: Who; toks: [Kind, string][] }[] = [
  { who: "a", toks: [["c", "// two people, one file"]] },
  { who: "o", toks: [["k", "function"], ["p", " "], ["f", "greet"], ["p", "(name) {"]] },
  { who: "a", toks: [["p", "  "], ["k", "return"], ["p", " "], ["s", "`Hello, ${name}!`"], ["p", ";"]] },
  { who: "o", toks: [["p", "}"]] },
  { who: "a", toks: [["f", "greet"], ["p", "("], ["s", '"world"'], ["p", ");"]] },
];
const LENGTHS = LINES.map((l) => l.toks.reduce((n, t) => n + t[1].length, 0));
const NAMES: Record<Who, string> = { a: "aman", o: "ornella" };

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function FlyCursor({ who, ref }: { who: Who; ref: React.Ref<HTMLDivElement> }) {
  const a = who === "a";
  return (
    <div ref={ref} aria-hidden className="pointer-events-none absolute z-10 opacity-0 will-change-transform" style={{ left: "-12%", top: "50%" }}>
      <svg viewBox="0 0 24 24" className="block w-[26px] drop-shadow-md sm:w-[34px]">
        <path d="M3 2l17 8-7 2-3 7z" fill={a ? "#232739" : "#fff"} stroke={a ? "#fff" : "#232739"} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
      <span className={cn("absolute left-[-6px] whitespace-nowrap rounded-xl px-4 py-1 text-[17px] font-extrabold sm:px-5 sm:text-[22px]", a ? "bottom-9 bg-navy text-white" : "top-9 bg-white text-navy")}>
        {NAMES[who]}
      </span>
    </div>
  );
}

export function HeroEditor() {
  const reduce = useReducedMotion();
  const [counts, setCounts] = useState<number[]>(() => LINES.map(() => 0));
  const [active, setActive] = useState(-1);
  const curA = useRef<HTMLDivElement>(null);
  const curO = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce) {
      setCounts(LENGTHS);
      setActive(LINES.length - 1);
      return;
    }
    let cancelled = false;
    const running: { stop: () => void }[] = [];
    const track = <T extends { stop: () => void }>(c: T) => {
      running.push(c);
      return c;
    };

    (async () => {
      await sleep(400);
      const a = curA.current;
      const o = curO.current;
      if (a && o) {
        await Promise.all([
          track(animate(a, { opacity: [0, 1], left: ["-12%", "18%"], top: ["55%", "28%"] }, { duration: 1.6, ease: [0.65, 0, 0.35, 1] })),
          track(animate(o, { opacity: [0, 1], left: ["112%", "70%"], top: ["95%", "62%"] }, { duration: 1.6, ease: [0.65, 0, 0.35, 1] })),
        ]);
        await Promise.all([track(animate(a, { opacity: 0 }, { duration: 0.4 })), track(animate(o, { opacity: 0 }, { duration: 0.4 }))]);
      }
      for (let i = 0; i < LINES.length; i++) {
        if (cancelled) return;
        setActive(i);
        await track(
          animate(0, LENGTHS[i], {
            duration: Math.max(0.5, LENGTHS[i] * 0.045),
            ease: "linear",
            onUpdate: (v) => setCounts((prev) => prev.map((c, j) => (j === i ? Math.round(v) : c))),
          }),
        );
        await sleep(250);
      }
    })();

    return () => {
      cancelled = true;
      running.forEach((c) => c.stop());
    };
  }, [reduce]);

  return (
    <div className="relative ml-auto max-w-[760px]">
      <FlyCursor who="a" ref={curA} />
      <FlyCursor who="o" ref={curO} />
      <div
        role="img"
        aria-label="Animated preview: two collaborators, aman and ornella, typing a greet function in the same file."
        className="rounded-2xl bg-code font-mono text-xs text-codeink shadow-[0_30px_70px_-20px_rgba(35,39,57,0.5)] sm:text-sm"
      >
        <div aria-hidden className="flex items-center gap-2 border-b border-white/10 px-4 py-3 text-xs text-[#9a9db8]">
          <i className="size-2.5 rounded-full bg-[#464a68]" />
          <i className="size-2.5 rounded-full bg-[#464a68]" />
          <i className="size-2.5 rounded-full bg-[#464a68]" />
          <span className="ml-auto flex gap-1.5">
            <em className="rounded-full border border-white/25 bg-navy px-2.5 py-0.5 font-medium not-italic text-white">aman</em>
            <em className="rounded-full bg-white px-2.5 py-0.5 font-medium not-italic text-navy">ornella</em>
          </span>
        </div>
        <div aria-hidden className="min-h-[230px] py-[18px]">
          {LINES.map((line, i) => {
            let left = counts[i];
            return (
              <div key={i} className="flex min-h-6 whitespace-pre py-0.5 pr-[18px]">
                <b className="w-8 flex-none pr-2.5 text-right font-normal text-[#5b5f80] sm:w-11 sm:pr-4">{i + 1}</b>
                <span>
                  {line.toks.map(([kind, text], j) => {
                    const take = Math.max(0, Math.min(text.length, left));
                    left -= take;
                    return take ? (
                      <span key={j} className={TOKEN_CLASS[kind]}>
                        {text.slice(0, take)}
                      </span>
                    ) : null;
                  })}
                </span>
                {active === i && (
                  <span className={cn("relative ml-px mt-0.5 inline-block h-5 w-0.5 animate-[blink_1s_steps(2)_infinite] motion-reduce:animate-none", line.who === "a" ? "bg-white" : "bg-rose")}>
                    <span className={cn("absolute bottom-[22px] left-0 whitespace-nowrap rounded-[7px_7px_7px_0] px-[9px] py-px font-sans text-xs font-bold", line.who === "a" ? "border border-white/30 bg-navy text-white" : "bg-white text-navy")}>
                      {NAMES[line.who]}
                    </span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
