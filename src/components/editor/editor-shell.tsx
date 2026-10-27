"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Check, Copy, Download, Loader2, Moon, Play, Sun, TriangleAlert } from "lucide-react";
import { API, type ConnectionStatus, type Files } from "@/lib/collab";
import { cn } from "@/lib/utils";

type PaneKey = "html" | "css" | "js" | "console" | "output";
type FileKey = keyof Files;
type Level = "" | "e" | "w" | "h";
interface LogEntry { id: number; level: Level; text: string }

const PANES: { key: PaneKey; label: string; file?: string }[] = [
  { key: "html", label: "HTML", file: "index.html" },
  { key: "css", label: "CSS", file: "style.css" },
  { key: "js", label: "JS", file: "script.js" },
  { key: "console", label: "Console" },
  { key: "output", label: "Output" },
];

const DEFAULT_FILES: Files = {
  html: "<h1>Hello, team!</h1>",
  css: "h1{font-family:sans-serif;color:#9a62b8}",
  js: "console.log('Welcome to CodersCollaboration!');",
};

// Forwards console output / errors to the parent and evaluates lines typed in the console input.
const SHIM = `<script>(function(){function s(l,a){parent.postMessage({__c:1,l:l,a:[].map.call(a,function(x){try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ")},"*")}["log","warn","error"].forEach(function(k){console[k]=function(){s(k[0]==="l"?"":k[0],arguments)}});onerror=function(m){s("e",[m])};onmessage=function(e){if(e.data&&e.data.__ev){try{var r=(0,eval)(e.data.__ev);if(r!==undefined)s("",[r])}catch(x){s("e",[x.message])}}}})()<\/script>`;

function buildDoc(files: Files, withShim: boolean) {
  const js = files.js.replace(/<\/script/gi, "<\\/script");
  return `<!doctype html><html><head><meta charset="utf-8"><style>${files.css}</style>${withShim ? SHIM : ""}</head><body>${files.html}<script>${js}<\/script></body></html>`;
}

function Pane({ title, right, visible, children }: { title: ReactNode; right?: ReactNode; visible: boolean; children: ReactNode }) {
  return (
    <section className={cn("min-h-0 min-w-0 flex-col overflow-hidden rounded-[14px] border border-ed-line bg-ed-panel", visible ? "flex" : "hidden")}>
      <div className="flex items-center justify-between border-b border-ed-line px-3.5 py-2.5 text-ed-mute">
        <span>{title}</span>
        {right}
      </div>
      {children}
    </section>
  );
}

function CodeEditor({ value, name, onChange }: { value: string; name: string; onChange: (v: string) => void }) {
  const gutter = useRef<HTMLDivElement>(null);
  const trapTab = useRef(true);
  const lines = value.split("\n").length;

  // Tab inserts two spaces; press Escape first to let Tab move focus (keyboard users).
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      trapTab.current = false;
    } else if (e.key === "Tab" && trapTab.current && !e.shiftKey) {
      e.preventDefault();
      const t = e.currentTarget;
      t.setRangeText("  ", t.selectionStart, t.selectionEnd, "end");
      onChange(t.value);
    } else if (e.key !== "Tab" && e.key !== "Shift") {
      trapTab.current = true;
    }
  };

  return (
    <div className="relative flex min-h-0 flex-1">
      <div ref={gutter} aria-hidden className="w-[46px] overflow-hidden whitespace-pre border-r border-ed-line pr-2 pt-3 text-right text-sm leading-[22px] text-ed-mute">
        {Array.from({ length: lines }, (_, i) => i + 1).join("\n")}
      </div>
      <textarea
        value={value}
        spellCheck={false}
        aria-label={`${name} (Esc then Tab moves focus out)`}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onScroll={(e) => {
          if (gutter.current) gutter.current.scrollTop = e.currentTarget.scrollTop;
        }}
        className="flex-1 resize-none whitespace-pre border-0 bg-transparent p-3 text-sm leading-[22px] text-ed-text outline-none [tab-size:2]"
      />
    </div>
  );
}

export function EditorShell({ room }: { room: string }) {
  const [files, setFiles] = useState<Files>(DEFAULT_FILES);
  const [visible, setVisible] = useState<Set<PaneKey>>(() => new Set<PaneKey>(["js", "console"]));
  const [light, setLight] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [srcDoc, setSrcDoc] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [busy, setBusy] = useState<"idle" | "syncing" | "running">("idle");
  const [conn, setConn] = useState<ConnectionStatus>("connecting");
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  const filesRef = useRef(files);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const logId = useRef(0);
  const sendTimer = useRef<number | undefined>(undefined);

  const addLog = useCallback((level: Level, text: string) => {
    setLogs((prev) => [...prev, { id: logId.current++, level, text }]);
  }, []);

  const run = useCallback(() => {
    setBusy("running");
    setSrcDoc(buildDoc(filesRef.current, true));
    setRunKey((k) => k + 1);
    window.setTimeout(() => setBusy("idle"), 300);
  }, []);

  // Realtime: join the room, apply remote edits, track connection status.
  useEffect(() => {
    const leave = API.join(room);
    const offRemote = API.onRemote((remote) => {
      filesRef.current = remote;
      setFiles(remote);
    });
    const offStatus = API.onStatus(setConn);
    return () => {
      offRemote();
      offStatus();
      leave();
    };
  }, [room]);

  useEffect(() => {
    run();
  }, [run]);

  useEffect(() => () => window.clearTimeout(sendTimer.current), []);

  // Console messages coming from the sandboxed output frame.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const d = e.data as { __c?: number; l?: string; a?: string } | null;
      if (d?.__c) addLog((d.l ?? "") as Level, String(d.a ?? ""));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [addLog]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [logs]);

  const toggle = useCallback((k: PaneKey) => {
    setVisible((prev) => {
      const next = new Set(prev);
      if (next.has(k)) {
        if (next.size > 1) next.delete(k);
      } else next.add(k);
      return next;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.altKey && /^Digit[1-5]$/.test(e.code)) {
        e.preventDefault();
        toggle(PANES[Number(e.code.slice(5)) - 1].key);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, run]);

  const edit = (key: FileKey, value: string) => {
    const next = { ...filesRef.current, [key]: value };
    filesRef.current = next;
    setFiles(next);
    setBusy("syncing");
    window.clearTimeout(sendTimer.current);
    sendTimer.current = window.setTimeout(() => {
      API.onChange(room, filesRef.current);
      setBusy("idle");
    }, 150);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/code/${room}`);
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    window.setTimeout(() => setCopied("idle"), 1600);
  };

  const exportHtml = () => {
    const url = URL.createObjectURL(new Blob([buildDoc(filesRef.current, false)], { type: "text/html" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `coderscollab-${room}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const status =
    busy === "running" ? "running…"
    : busy === "syncing" ? "syncing…"
    : conn === "live" ? "synced"
    : conn === "local" ? "synced · this browser"
    : conn === "connecting" ? "connecting…"
    : "offline · edits not shared";

  const actBtn = "flex items-center gap-2 rounded-[10px] border border-ed-line px-3 py-1.5 font-medium text-ed-text hover:border-ed-accent";

  return (
    <div data-theme={light ? "light" : "dark"} className="editor-root fixed inset-0 z-20 flex flex-col bg-ed-bg pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] font-mono text-[13px] text-ed-text">
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: "easeOut" }} className="flex flex-wrap items-center gap-3 border-b border-ed-line px-3.5 py-2.5">
        <Link href="/" title="Back to home" className="font-sans text-lg font-extrabold tracking-tight">
          {"{"}<b className="text-ed-accent">Coders</b>Collab{"}"}
        </Link>
        <button type="button" onClick={copyLink} title="Copy room link" className="flex items-center gap-2 rounded-[9px] border border-dashed border-ed-line px-2.5 py-1.5 text-ed-mute hover:border-ed-accent">
          <span className="max-w-[40vw] truncate">/code/{room}</span>
          {copied === "ok" ? <Check aria-hidden className="size-4 text-ed-accent" /> : <Copy aria-hidden className="size-4" />}
          <span role="status" className="sr-only md:not-sr-only md:text-xs">
            {copied === "ok" ? "copied" : copied === "fail" ? "copy failed" : ""}
          </span>
        </button>

        <div role="toolbar" aria-label="Panes" className="order-5 flex w-full gap-1.5 overflow-x-auto md:order-none md:mx-auto md:w-auto">
          {PANES.map((p, i) => {
            const on = visible.has(p.key);
            return (
              <button
                key={p.key}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(p.key)}
                title={`Alt + ${i + 1}`}
                className={cn("flex items-center gap-2 whitespace-nowrap rounded-[10px] border px-3 py-1.5 font-medium", on ? "border-ed-line text-ed-text shadow-[inset_0_-2px_var(--ed-g)]" : "border-transparent text-ed-mute")}
              >
                <span className={cn("grid size-5 place-items-center rounded-md text-[11px]", on ? "bg-ed-accent text-[#03130d]" : "bg-ed-line")}>{i + 1}</span>
                {p.label}
              </button>
            );
          })}
        </div>

        <span title="You" className="ml-auto grid size-[30px] place-items-center rounded-lg bg-ed-accent text-[11px] font-bold text-[#03130d] md:ml-0">YOU</span>
        <button type="button" className={actBtn} onClick={() => setLight((v) => !v)} aria-label={light ? "Switch to dark theme" : "Switch to light theme"}>
          {light ? <Moon aria-hidden className="size-4" /> : <Sun aria-hidden className="size-4" />}
        </button>
        <button type="button" className={actBtn} onClick={exportHtml}>
          <Download aria-hidden className="size-4" /> Export
        </button>
        <button type="button" onClick={run} className="flex items-center gap-2 rounded-[10px] border border-ed-accent bg-ed-accent px-3 py-1.5 font-bold text-[#03130d]">
          <Play aria-hidden className="size-4" /> Run
        </button>
      </motion.div>

      {conn === "offline" && (
        <div role="alert" className="flex items-center gap-2 border-b border-ed-line bg-[#e8c85a]/15 px-3.5 py-2 text-[#e8c85a]">
          <TriangleAlert aria-hidden className="size-4 shrink-0" />
          Can’t reach the collaboration server. Your edits stay in this tab and aren’t shared. Retrying…
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
        style={{ "--cols": visible.size } as React.CSSProperties}
        className="grid min-h-0 flex-1 grid-cols-[repeat(var(--cols),minmax(0,1fr))] gap-3 p-2.5 max-[820px]:auto-rows-[minmax(0,1fr)] max-[820px]:grid-cols-1"
      >
        {PANES.map((p) => {
          const vis = visible.has(p.key);
          if (p.file) {
            const k = p.key as FileKey;
            const lines = files[k].split("\n").length;
            return (
              <Pane key={p.key} visible={vis} title={<><b className="mr-2 font-medium text-[#e8c85a]">{p.label}</b>{p.file}</>} right={<span>{lines} ln</span>}>
                <CodeEditor value={files[k]} name={p.file} onChange={(v) => edit(k, v)} />
              </Pane>
            );
          }
          if (p.key === "console") {
            return (
              <Pane
                key={p.key}
                visible={vis}
                title={<>❯_ console {logs.length}</>}
                right={
                  <button type="button" onClick={() => setLogs([])} className="hover:text-ed-text">
                    clear
                  </button>
                }
              >
                <div ref={logRef} role="log" aria-live="polite" className="flex-1 overflow-auto whitespace-pre-wrap px-3.5 py-3 leading-[22px]">
                  {logs.length === 0 ? (
                    <div className="text-ed-mute">{"// Nothing logged yet.\n// Press Run or Ctrl + Enter, and logs from your code land here."}</div>
                  ) : (
                    logs.map((l) => (
                      <div key={l.id} className={l.level === "e" ? "text-[#ff7b7b]" : l.level === "w" ? "text-[#e8c85a]" : l.level === "h" ? "text-ed-mute" : ""}>
                        {l.text}
                      </div>
                    ))
                  )}
                </div>
                <input
                  aria-label="Run JavaScript in the output frame"
                  placeholder="Type JS and press Enter to run it…"
                  autoComplete="off"
                  onKeyDown={(e) => {
                    const input = e.currentTarget;
                    if (e.key === "Enter" && input.value.trim()) {
                      addLog("h", `› ${input.value}`);
                      iframeRef.current?.contentWindow?.postMessage({ __ev: input.value }, "*");
                      input.value = "";
                    }
                  }}
                  className="border-0 border-t border-ed-line bg-transparent px-3.5 py-3 outline-none"
                />
              </Pane>
            );
          }
          return (
            <Pane key={p.key} visible={vis} title="▶ output" right={busy === "running" ? <Loader2 aria-label="Running" className="size-4 animate-spin" /> : null}>
              <iframe key={runKey} ref={iframeRef} title="Output" sandbox="allow-scripts" srcDoc={srcDoc} className="flex-1 border-0 bg-white" />
            </Pane>
          );
        })}
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex gap-4 border-t border-ed-line px-3.5 py-1.5 text-xs text-ed-mute">
        <span aria-live="polite">
          <em className={cn("not-italic", conn === "offline" ? "text-[#ff7b7b]" : "text-ed-accent")}>●</em> {status}
        </span>
        <span>
          {visible.size} pane{visible.size === 1 ? "" : "s"}
        </span>
        <span className="ml-auto hidden md:inline">Alt + 1–5 toggles panes · Ctrl + Enter runs</span>
        <span className="md:ml-0">{light ? "Daylight" : "Abyss"}</span>
      </motion.div>
    </div>
  );
}
