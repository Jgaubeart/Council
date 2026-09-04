interface SidebarSectionProps {
  label: string;
  value: string;
  muted?: boolean;
}

function SidebarSection({ label, value, muted = false }: SidebarSectionProps) {
  return (
    <section className="border-b border-zinc-200/70 px-6 py-5">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-400">
        {label}
      </h2>
      <p
        className={`mt-2 text-sm leading-6 ${
          muted ? "text-zinc-400" : "text-zinc-700"
        }`}
      >
        {value}
      </p>
    </section>
  );
}

export function RightSidebar() {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-l border-zinc-200/80 bg-[#fbfbfa] md:flex xl:w-80">
      <div className="flex items-center justify-between border-b border-zinc-200/80 px-6 py-4">
        <h2 className="text-sm font-semibold tracking-tight text-zinc-900">
          Session Brief
        </h2>
        <span className="font-mono text-xs text-zinc-400">01</span>
      </div>

      <SidebarSection label="Current Objective" value="No active objective" muted />
      <SidebarSection label="Departments Consulted" value="None" muted />
      <SidebarSection label="Sources" value="0 sources" muted />
      <SidebarSection
        label="Proposed Actions"
        value="No proposed actions"
        muted
      />

      <div className="mt-auto px-6 py-5 text-xs leading-5 text-zinc-400">
        Council will summarize context here as the session progresses.
      </div>
    </aside>
  );
}
