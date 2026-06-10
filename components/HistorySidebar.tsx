"use client";

import { relativeTime, statusKind, type StatusKind } from "@/lib/format";
import { methodColor } from "@/lib/methodColor";
import type { HistoryEntry } from "@/lib/types";
import { HistoryIcon } from "./icons";

interface Props {
  entries: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const STATUS_COLOR: Record<StatusKind, string> = {
  success: "text-success",
  redirect: "text-info",
  "client-error": "text-warning",
  "server-error": "text-danger",
  info: "text-muted",
  unknown: "text-faint",
};

function shortUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.host}${u.pathname}${u.search}`;
  } catch {
    return url;
  }
}

export function HistorySidebar({ entries, onSelect, onClear }: Props) {
  return (
    <aside className="flex h-full w-full flex-col border-r border-border bg-panel">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-fg">
          <HistoryIcon width={15} height={15} className="text-muted" />
          History
        </div>
        {entries.length > 0 && (
          <button type="button" onClick={onClear} className="btn-ghost text-xs">
            Clear
          </button>
        )}
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-xs leading-relaxed text-faint">
            Requests you send will appear here. Click one to load it back.
          </p>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-auto px-2 pb-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="group w-full rounded-md px-2 py-2 text-left transition hover:bg-panel-2"
              >
                <div className="flex items-center gap-2">
                  <span className={`shrink-0 text-[11px] font-bold ${methodColor(entry.method)}`}>
                    {entry.method}
                  </span>
                  <span className="truncate font-mono text-[12px] text-muted group-hover:text-fg">
                    {shortUrl(entry.url)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 pl-0.5 text-[11px]">
                  <span className={STATUS_COLOR[statusKind(entry.status)]}>{entry.status}</span>
                  <span className="text-faint">·</span>
                  <span className="text-faint">{relativeTime(entry.createdAt)}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
