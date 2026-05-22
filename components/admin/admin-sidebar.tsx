'use client';

const SIDEBAR_ITEMS = [
  { id: 'basic-info', label: 'Basic Info' },
];

function PersonIcon() {
  return (
    <svg className="size-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

interface DesktopSidebarProps {
  expanded: boolean;
  activeSection: string;
}

export function DesktopSidebar({ expanded, activeSection }: DesktopSidebarProps) {
  return (
    <aside className={`shrink-0 overflow-hidden border-r border-[var(--border)] bg-[var(--bg-mid)]/60 transition-[width] duration-300 ease-in-out ${expanded ? 'w-56' : 'w-14'}`} style={{ willChange: 'width' }}>
      <nav className="space-y-1 p-3">
        {SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors ${
              activeSection === item.id
                ? 'bg-[var(--button-hover)] text-[var(--text)]'
                : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
            } ${expanded ? 'gap-3 px-3 justify-start' : 'justify-center px-0'}`}
            title={!expanded ? item.label : undefined}
          >
            <PersonIcon />
            <span className={`truncate ${expanded ? '' : 'hidden'}`}>{item.label}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

interface MobileSidebarProps {
  open: boolean;
  activeSection: string;
  onClose: () => void;
}

export function MobileSidebar({ open, activeSection, onClose }: MobileSidebarProps) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-56 flex-col bg-[var(--bg-mid)] shadow-xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ willChange: 'transform' }}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] px-4">
          <span className="text-sm font-semibold">Navigation</span>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-md text-[var(--text-dim)] hover:bg-[var(--button-hover)]"
          >
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {SIDEBAR_ITEMS.map((item) => (
            <button
              key={item.id}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                activeSection === item.id
                  ? 'bg-[var(--button-hover)] text-[var(--text)]'
                  : 'text-[var(--text-dim)] hover:bg-[var(--button)] hover:text-[var(--text-muted)]'
              }`}
            >
              <PersonIcon />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
