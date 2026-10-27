"use client";

import Link from "next/link";

export default function EditorError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="editor-root fixed inset-0 grid place-items-center bg-ed-bg px-6 text-center text-ed-text">
      <div role="alert">
        <h1 className="mb-2 text-2xl font-bold">The editor hit a problem</h1>
        <p className="mb-6 text-ed-mute">Your room link is still valid. Reload the editor to rejoin.</p>
        <div className="flex justify-center gap-3">
          <button type="button" onClick={reset} className="rounded-[10px] bg-ed-accent px-4 py-2 font-bold text-[#03130d]">
            Reload editor
          </button>
          <Link href="/" className="rounded-[10px] border border-ed-line px-4 py-2">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
