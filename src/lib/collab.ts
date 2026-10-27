/**
 * Backend adapter. Same three hooks as the prototype's `API` object
 * (createRoom, onChange, onRemote) plus join/onStatus for connection state.
 *
 * - NEXT_PUBLIC_API_URL set    -> createRoom() does POST {url}/api/rooms and expects { id }.
 * - NEXT_PUBLIC_SOCKET_URL set -> socket.io: emit "join-room" (id), emit/listen "code-change".
 * - Neither set                -> random room id + BroadcastChannel (syncs tabs in this browser only).
 */
export type Files = { html: string; css: string; js: string };
export type ConnectionStatus = "connecting" | "live" | "local" | "offline";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
const SOCKET_URL = (process.env.NEXT_PUBLIC_SOCKET_URL ?? "").replace(/\/$/, "");

type RemoteCb = (files: Files) => void;
type StatusCb = (status: ConnectionStatus) => void;
type Socket = import("socket.io-client").Socket;
interface Transport {
  send(files: Files): void;
  close(): void;
}

let transport: Transport | null = null;
let currentRoom = "";
let lastFiles: Files | null = null;
let status: ConnectionStatus = "connecting";
const remoteListeners = new Set<RemoteCb>();
const statusListeners = new Set<StatusCb>();

function setStatus(next: ConnectionStatus) {
  status = next;
  statusListeners.forEach((cb) => cb(next));
}

function isFiles(v: unknown): v is Files {
  if (typeof v !== "object" || v === null) return false;
  const o = v as Record<string, unknown>;
  return typeof o.html === "string" && typeof o.css === "string" && typeof o.js === "string";
}

function emitRemote(files: Files) {
  lastFiles = files;
  remoteListeners.forEach((cb) => cb(files));
}

function randomId() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

function openLocal(room: string): Transport {
  if (typeof BroadcastChannel === "undefined") {
    setStatus("offline");
    return { send() {}, close() {} };
  }
  const channel = new BroadcastChannel(`cc-room-${room}`);
  channel.onmessage = (e: MessageEvent<{ type?: string; files?: unknown }>) => {
    const msg = e.data;
    if (msg?.type === "code-change" && isFiles(msg.files)) emitRemote(msg.files);
    if (msg?.type === "sync-request" && lastFiles) {
      channel.postMessage({ type: "code-change", files: lastFiles });
    }
  };
  channel.postMessage({ type: "sync-request" });
  setStatus("local");
  return {
    send: (files) => channel.postMessage({ type: "code-change", files }),
    close: () => channel.close(),
  };
}

function openSocket(room: string): Transport {
  let socket: Socket | null = null;
  let closed = false;
  setStatus("connecting");
  import("socket.io-client")
    .then(({ io }) => {
      if (closed) return;
      const s = io(SOCKET_URL, { transports: ["websocket", "polling"] });
      socket = s;
      s.on("connect", () => {
        s.emit("join-room", room);
        setStatus("live");
      });
      s.on("disconnect", () => setStatus("offline"));
      s.on("connect_error", () => setStatus("offline"));
      s.on("code-change", (payload: unknown) => {
        const files = isFiles(payload) ? payload : (payload as { files?: unknown } | null)?.files;
        if (isFiles(files)) emitRemote(files);
      });
    })
    .catch(() => setStatus("offline"));
  return {
    send: (files) => {
      socket?.emit("code-change", { room, files });
    },
    close: () => {
      closed = true;
      socket?.disconnect();
    },
  };
}

export const API = {
  /** POST /api/rooms -> { id } */
  async createRoom(): Promise<{ id: string }> {
    if (!API_URL) return { id: randomId() };
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Free hosts can take a while to wake from sleep.
        signal: AbortSignal.timeout(45_000),
      });
    } catch {
      throw new Error("Couldn't reach the server. Check your connection and try again.");
    }
    if (!res.ok) throw new Error(`The server couldn't create a room (error ${res.status}). Try again in a moment.`);
    const data: unknown = await res.json().catch(() => null);
    const id = (data as { id?: unknown } | null)?.id;
    if (typeof id !== "string" || !id) throw new Error("The server sent back an unexpected response.");
    return { id };
  },

  /** Open the realtime channel for a room. Returns a leave function. */
  join(room: string): () => void {
    transport?.close();
    currentRoom = room;
    transport = SOCKET_URL ? openSocket(room) : openLocal(room);
    return () => {
      if (currentRoom !== room) return;
      transport?.close();
      transport = null;
      currentRoom = "";
    };
  },

  /** socket.emit('code-change', { room, files }) */
  onChange(room: string, files: Files): void {
    lastFiles = files;
    if (room === currentRoom) transport?.send(files);
  },

  /** socket.on('code-change', files => cb(files)). Returns an unsubscribe function. */
  onRemote(cb: RemoteCb): () => void {
    remoteListeners.add(cb);
    return () => {
      remoteListeners.delete(cb);
    };
  },

  onStatus(cb: StatusCb): () => void {
    statusListeners.add(cb);
    cb(status);
    return () => {
      statusListeners.delete(cb);
    };
  },
};
