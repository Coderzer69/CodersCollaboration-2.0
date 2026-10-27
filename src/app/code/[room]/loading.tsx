export default function Loading() {
  return (
    <div role="status" aria-label="Loading editor" className="editor-root fixed inset-0 flex flex-col bg-ed-bg">
      <div className="h-[53px] animate-pulse border-b border-ed-line motion-reduce:animate-none" />
      <div className="grid flex-1 gap-3 p-2.5 md:grid-cols-2">
        <div className="animate-pulse rounded-[14px] border border-ed-line bg-ed-panel motion-reduce:animate-none" />
        <div className="animate-pulse rounded-[14px] border border-ed-line bg-ed-panel motion-reduce:animate-none" />
      </div>
      <span className="sr-only">Loading editor…</span>
    </div>
  );
}
