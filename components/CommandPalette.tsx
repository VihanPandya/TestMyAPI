"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ReturnIcon, SearchIcon } from "./icons";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  keywords?: string;
  section?: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  commands: Command[];
}

export function CommandPalette({ open, onClose, commands }: Props) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) =>
      `${c.label} ${c.keywords ?? ""} ${c.section ?? ""}`.toLowerCase().includes(q),
    );
  }, [query, commands]);

  useEffect(() => {
    setActive((a) => Math.min(a, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open) return null;

  const run = (index: number) => {
    const command = filtered[index];
    if (!command) return;
    onClose();
    command.run();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % Math.max(1, filtered.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + filtered.length) % Math.max(1, filtered.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let lastSection: string | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close command palette"
      />
      <div role="dialog" aria-modal="true" aria-label="Command palette" className="menu relative z-10 w-full max-w-xl">
        <div className="flex items-center gap-2.5 border-b border-line px-4">
          <SearchIcon width={16} height={16} className="shrink-0 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type a command…"
            autoFocus
            spellCheck={false}
            className="w-full bg-transparent py-3.5 text-sm text-fg outline-none placeholder:text-faint"
          />
        </div>

        <div ref={listRef} className="max-h-80 overflow-auto p-1.5">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-faint">No matching commands.</p>
          ) : (
            filtered.map((command, index) => {
              const section = command.section;
              const showSection = section && section !== lastSection;
              lastSection = section;
              return (
                <div key={command.id}>
                  {showSection && (
                    <div className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-faint">
                      {section}
                    </div>
                  )}
                  <button
                    type="button"
                    data-active={index === active}
                    onMouseMove={() => setActive(index)}
                    onClick={() => run(index)}
                    className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm text-muted transition data-[active=true]:bg-white/5 data-[active=true]:text-fg"
                  >
                    <span>{command.label}</span>
                    {command.hint ? (
                      <span className="font-mono text-[11px] text-faint">{command.hint}</span>
                    ) : (
                      index === active && <ReturnIcon width={13} height={13} className="text-faint" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
