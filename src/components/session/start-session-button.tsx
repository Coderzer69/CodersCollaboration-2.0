"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/components/session/session-provider";
import type { ComponentProps } from "react";

type Props = Pick<ComponentProps<typeof Button>, "variant" | "size" | "className"> & { children?: React.ReactNode };

export function StartSessionButton({ children = "Start a session", ...props }: Props) {
  const { start, busy } = useSession();
  return (
    <Button onClick={start} disabled={busy} aria-busy={busy} {...props}>
      {busy && <Loader2 aria-hidden className="size-4 animate-spin" />}
      {children}
    </Button>
  );
}
