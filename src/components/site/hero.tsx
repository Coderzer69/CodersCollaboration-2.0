import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StartSessionButton } from "@/components/session/start-session-button";
import { HeroEditor } from "./hero-editor";

export function Hero() {
  return (
    <section className="brand-gradient relative overflow-hidden pb-24 pt-32 text-navy max-sm:pt-28">
      <div className="mx-auto max-w-[1120px] px-6">
        <h1 className="mb-5 max-w-[11ch] text-[clamp(44px,7.4vw,92px)] font-extrabold leading-[0.98] tracking-[-0.035em]">Code together, live.</h1>
        <p className="mb-8 max-w-[46ch] text-xl">Open an editor, send the link, and edit the same file at the same time. No setup, no screen sharing.</p>
        <div className="mb-14 flex flex-wrap gap-3">
          <StartSessionButton size="lg">Start a session</StartSessionButton>
          <Button asChild variant="ghost" size="lg">
            <a href="#how-it-works">
              See how it works <ArrowRight aria-hidden className="size-5" />
            </a>
          </Button>
        </div>
        <HeroEditor />
      </div>
    </section>
  );
}
