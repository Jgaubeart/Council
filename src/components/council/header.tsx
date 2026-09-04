export function CouncilHeader() {
  return (
    <header className="flex shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/95 px-6 py-4 backdrop-blur sm:px-8">
      <div className="flex items-center gap-3">
        <div
          aria-hidden="true"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 font-mono text-sm font-medium text-zinc-600"
        >
          CG
        </div>
        <div className="leading-tight">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Cabinet Genies
          </p>
          <h1 className="text-lg font-semibold tracking-tight text-zinc-900">
            Council
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2.5 rounded-full border border-zinc-200/80 bg-zinc-50 px-3.5 py-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-40" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        <span className="text-sm font-medium text-zinc-700">Council Ready</span>
      </div>
    </header>
  );
}
