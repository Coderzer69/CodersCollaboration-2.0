export const SITE = {
  name: "CodersCollaboration",
  description:
    "Open an editor, send the link, and edit the same file at the same time. Write HTML, CSS and JavaScript together with live output. No setup, no screen sharing.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://coderscollaboration.onrender.com",
} as const;

export const NAV_LINKS = [
  { id: "features", label: "Features" },
  { id: "use-cases", label: "Use cases" },
  { id: "how-it-works", label: "How it works" },
  { id: "faq", label: "FAQ" },
] as const;

export const ROOM_ID_PATTERN = /^[a-zA-Z0-9_-]{4,64}$/;
