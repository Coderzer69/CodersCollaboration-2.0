"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { animate, MotionConfig } from "motion/react";
import { AlertTriangle, X } from "lucide-react";
import { API } from "@/lib/collab";

interface SessionContextValue {
  start: (e: MouseEvent) => void;
  busy: boolean;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside <SessionProvider>");
  return ctx;
}

type Bezier = [number, number, number, number];
const EASE_IN: Bezier = [0.55, 0.06, 0.68, 0.19];
const EASE_OUT: Bezier = [0.22, 1, 0.36, 1];
const EASE_IN_OUT: Bezier = [0.76, 0, 0.24, 1];
const EASE_BACK: Bezier = [0.34, 1.56, 0.64, 1];

export function SessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const overlay = useRef<HTMLDivElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const idEl = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLElement>(null);
  const tagA = useRef<HTMLSpanElement>(null);
  const tagO = useRef<HTMLSpanElement>(null);
  const waiter = useRef<{ path: string; resolve: () => void } | null>(null);

  // Resolve the pending navigation once the new route is on screen.
  useEffect(() => {
    const w = waiter.current;
    if (w && pathname === w.path) {
      waiter.current = null;
      w.resolve();
    }
  }, [pathname]);

  useEffect(() => {
    if (!error) return;
    const t = window.setTimeout(() => setError(null), 8000);
    return () => window.clearTimeout(t);
  }, [error]);

  const navigate = useCallback(
    (path: string) =>
      new Promise<void>((resolve) => {
        waiter.current = { path, resolve };
        router.push(path);
        window.setTimeout(() => {
          if (waiter.current?.path === path) {
            waiter.current = null;
            resolve();
          }
        }, 5000);
      }),
    [router],
  );

  const start = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault();
      if (busyRef.current) return;
      busyRef.current = true;
      setBusy(true);
      setError(null);

      const x = e.clientX || window.innerWidth / 2;
      const y = e.clientY || window.innerHeight / 2;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let room: string;
      try {
        room = (await API.createRoom()).id;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Couldn't create a room. Try again.");
        busyRef.current = false;
        setBusy(false);
        return;
      }

      const path = `/code/${room}`;
      const ov = overlay.current;
      const pn = panel.current;
      const id = idEl.current;
      const pb = bar.current;
      const a = tagA.current;
      const o = tagO.current;

      if (reduce || !ov || !pn || !id || !pb || !a || !o) {
        await navigate(path);
        busyRef.current = false;
        setBusy(false);
        return;
      }

      const W = window.innerWidth;
      const H = window.innerHeight;
      try {
        // Reset to the starting frame.
        id.textContent = "";
        ov.style.transform = "none";
        ov.style.clipPath = `circle(0% at ${x}px ${y}px)`;
        ov.style.display = "grid";
        await Promise.all([
          animate(pn, { opacity: 0, scale: 0.9 }, { duration: 0 }),
          animate(pb, { width: "0%" }, { duration: 0 }),
          animate(a, { x: -120, y: H * 0.25, opacity: 0 }, { duration: 0 }),
          animate(o, { x: W + 60, y: H * 0.7, opacity: 0 }, { duration: 0 }),
        ]);

        // 1. Circle wipe from the click point.
        await animate(ov, { clipPath: [`circle(0% at ${x}px ${y}px)`, `circle(150% at ${x}px ${y}px)`] }, { duration: 0.8, ease: EASE_IN });

        // 2. Labeled cursors fly in while the room id types out.
        await Promise.all([
          animate(pn, { opacity: 1, scale: 1 }, { duration: 0.4, ease: EASE_BACK }),
          animate(a, { opacity: 1, x: W * 0.22, y: H * 0.32 }, { duration: 0.9, ease: EASE_OUT }),
          animate(o, { opacity: 1, x: W * 0.66, y: H * 0.6 }, { duration: 0.9, ease: EASE_OUT }),
          animate(0, path.length, {
            duration: 0.7,
            delay: 0.1,
            ease: "linear",
            onUpdate: (v) => {
              id.textContent = path.slice(0, Math.round(v));
            },
          }),
          animate(pb, { width: "100%" }, { duration: 0.7, ease: "easeInOut" }),
        ]);

        // 3. Cursors converge, then the editor route takes over and the overlay lifts.
        await Promise.all([
          animate(a, { x: W * 0.5 - 40, y: H * 0.5 }, { duration: 0.55, delay: 0.1, ease: "easeInOut" }),
          animate(o, { x: W * 0.5 - 40, y: H * 0.5 }, { duration: 0.55, delay: 0.1, ease: "easeInOut" }),
        ]);
        await navigate(path);
        await animate(ov, { transform: ["translateY(0%)", "translateY(-100%)"] }, { duration: 0.75, ease: EASE_IN_OUT });
      } catch {
        await navigate(path);
      } finally {
        ov.style.display = "none";
        busyRef.current = false;
        setBusy(false);
      }
    },
    [navigate],
  );

  return (
    <MotionConfig reducedMotion="user">
      <SessionContext.Provider value={{ start, busy }}>{children}</SessionContext.Provider>

      <div
        ref={overlay}
        role="status"
        aria-live="polite"
        aria-hidden={!busy}
        style={{ display: "none" }}
        className="brand-gradient fixed inset-0 z-[60] place-items-center text-center text-navy"
      >
        <div ref={panel}>
          <div className="text-[clamp(28px,5vw,52px)] font-extrabold tracking-tight">Creating your room</div>
          <div ref={idEl} className="mb-5 mt-2 min-h-7 font-mono text-lg font-medium" />
          <div className="mx-auto h-1.5 w-[220px] overflow-hidden rounded-full bg-navy/20">
            <i ref={bar} className="block h-full w-0 rounded-full bg-navy" />
          </div>
        </div>
        <span ref={tagA} className="absolute left-0 top-0 rounded-xl bg-navy px-[18px] py-[5px] text-xl font-extrabold text-white">
          aman
        </span>
        <span ref={tagO} className="absolute left-0 top-0 rounded-xl bg-white px-[18px] py-[5px] text-xl font-extrabold text-navy">
          ornella
        </span>
      </div>

      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 bottom-6 z-[65] mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-line bg-surface p-4 text-ink shadow-xl"
        >
          <AlertTriangle aria-hidden className="mt-0.5 size-5 shrink-0 text-rose" />
          <p className="flex-1 text-base">{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss" className="rounded-md p-1 text-mute hover:text-ink">
            <X aria-hidden className="size-4" />
          </button>
        </div>
      )}
    </MotionConfig>
  );
}
