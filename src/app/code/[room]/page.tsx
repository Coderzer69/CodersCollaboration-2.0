import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditorShell } from "@/components/editor/editor-shell";
import { ROOM_ID_PATTERN } from "@/lib/site";

type Props = { params: Promise<{ room: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { room } = await params;
  return { title: `Room ${room}`, robots: { index: false, follow: false } };
}

export default async function CodePage({ params }: Props) {
  const { room } = await params;
  if (!ROOM_ID_PATTERN.test(room)) notFound();
  return <EditorShell room={room} />;
}
