import { Briefcase, Download, GraduationCap, Keyboard, LayoutPanelLeft, MousePointer2, Play, Terminal, Users, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const FEATURES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Zap, title: "Live sync", body: "Every keystroke shows up for everyone in the room, so nobody works from a stale copy." },
  { icon: MousePointer2, title: "Named cursors", body: "See who is where. Each person’s cursor carries their name." },
  { icon: LayoutPanelLeft, title: "Five panes", body: "HTML, CSS, JS, console and output. Show only the ones you need." },
  { icon: Play, title: "Instant output", body: "Press Run, or Ctrl + Enter, and the result renders in a sandboxed frame." },
  { icon: Terminal, title: "Built-in console", body: "Logs and errors land in the console, and you can run a line of JS right there." },
  { icon: Download, title: "Export anytime", body: "Download your work as a single HTML file whenever you want a copy." },
];

export const USE_CASES: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Users, title: "Pair program", body: "Write, debug, and refactor side by side. Every keystroke shows up for everyone, with each person’s cursor labeled by name." },
  { icon: Briefcase, title: "Run interviews", body: "Set a task and watch the candidate think in real time, instead of squinting at a whiteboard or a paused video call." },
  { icon: GraduationCap, title: "Teach code", body: "Show students the fix as you type it, and let them type back in the same file." },
];

export const STEPS = [
  { title: "Open an editor", body: "Click Start a session and a fresh editor opens." },
  { title: "Share the link", body: "Copy the URL and send it to anyone who should join." },
  { title: "Code together", body: "Everyone edits at once and sees each other’s cursors." },
] as const;

export const FAQS = [
  { q: "Do I need an account?", a: "No. Start a session and you land in an editor straight away. Anyone with the link can join." },
  { q: "Which languages can I write?", a: "HTML, CSS and JavaScript, with live output and a console. Each lives in its own pane." },
  { q: "How do I invite someone?", a: "Click the room link at the top of the editor to copy it, then send it to them." },
  { q: "Can I keep a copy of my work?", a: "Yes. Use Export in the editor to download everything as one HTML file." },
  { q: "Does it work on my phone?", a: "Yes. On small screens the panes stack so you can switch between them with the toggles in the top bar." },
  { q: "Which keyboard shortcuts are there?", a: "Alt + 1 to 5 toggles the panes, and Ctrl + Enter (Cmd + Enter on Mac) runs your code." },
] as const;
