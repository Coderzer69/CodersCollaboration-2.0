import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="main" className="brand-gradient grid min-h-screen place-items-center px-6 text-center text-navy">
      <div>
        <h1 className="mb-3 text-[clamp(40px,7vw,80px)] font-extrabold leading-none tracking-tight">Page not found</h1>
        <p className="mb-8 text-xl">That link doesn’t lead anywhere.</p>
        <Button asChild size="lg">
          <Link href="/">Back to home</Link>
        </Button>
      </div>
    </main>
  );
}
