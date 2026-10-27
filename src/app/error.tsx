"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <h1 className="mb-3 text-4xl font-extrabold tracking-tight">Something went wrong</h1>
        <p className="mb-8 text-mute">An unexpected error occurred. Try again.</p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  );
}
