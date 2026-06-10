"use client";

import { useState } from "react";
import { relativeTime, statusKind, type StatusKind } from "@/lib/format";
import { methodColor } from "@/lib/methodColor";
import type { HistoryEntry, SavedRequest } from "@/lib/types";
import { BookmarkIcon, TrashIcon } from "./icons";

interface Props {
  saved: SavedRequest[];
  history: HistoryEntry[];
  onRestoreSaved: (item: SavedRequest) => void;
  onDeleteSaved: (id: string) => void;
  onRestoreHistory: (item: HistoryEntry) => void;
  onClearHistory: () => void;
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

type Tab = "collection" | "history";

export function Sidebar({
  saved,
  history,
  onRestoreSaved,
  onDeleteSaved,
  onRestoreHistory,
  onClearHistory,
}: Props) {
  const [tab, setTab] = useState<Tab>("collection");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "collection", label: "Collection", count: saved.length },
    { id: "history", label: "History", count: history.length },
  ];

  return (
    <aside className="flex h-full w-full flex-col border-r border-line">
      <div className="flex items-center gap-4 px-4 pt-3.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`relative pb-2.5 text-[13px] font-medium transition ${
              tab === t.id ? "text-fg" : "text-faint hover:text-muted"
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-[11px] text-faint">{t.count}</span>}
            {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-px bg-fg" />}
          </button>
        ))}
        {tab === "history" && history.length > 0 && (
          <button type="button" onClick={onClearHistory} className="btn-ghost ml-auto -mr-1 py-1 text-xs">
            Clear
          </button>
        )}
      </div>

      <div className="h-px bg-line" />

      <div className="min-h-0 flex-1 overflow-auto p-2">
        {tab === "collection" ? (
          saved.length === 0 ? (
            <Empty
              icon={<BookmarkIcon width={18} height={18} />}
              text="No saved requests yet. Save one with ⌘S."
            />
          ) : (
            <ul className="space-y-0.5">
              {saved.map((item) => (
                <li key={item.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onRestoreSaved(item)}
                    className="w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-white/5"
                  >
                    <div className="truncate pr-6 text-[13px] font-medium text-fg">{item.name}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`text-[10px] font-bold ${methodColor(item.request.method)}`}>
                        {item.request.method}
                      </span>
                      <span className="truncate font-mono text-[11px] text-faint">
                        {shortUrl(item.request.url)}
                      </span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSaved(item.id)}
                    aria-label="Delete saved request"
                    className="absolute right-1.5 top-2 rounded p-1 text-faint opacity-0 transition hover:text-danger group-hover:opacity-100"
                  >
                    <TrashIcon width={13} height={13} />
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : history.length === 0 ? (
          <Empty text="Requests you send appear here." />
        ) : (
          <ul className="space-y-0.5">
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onRestoreHistory(item)}
                  className="w-full rounded-lg px-2.5 py-2 text-left transition hover:bg-white/5"
                >
                  <div className="flex items-center gap-2">
                    <span className={`shrink-0 text-[10px] font-bold ${methodColor(item.method)}`}>
                      {item.method}
                    </span>
                    <span className="truncate font-mono text-[11px] text-muted">
                      {shortUrl(item.url)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[11px]">
                    <span className={STATUS_COLOR[statusKind(item.status)]}>{item.status}</span>
                    <span className="text-faint">·</span>
                    <span className="text-faint">{relativeTime(item.createdAt)}</span>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}

function Empty({ icon, text }: { icon?: React.ReactNode; text: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      {icon && <span className="text-line-strong">{icon}</span>}
      <p className="text-xs leading-relaxed text-faint">{text}</p>
    </div>
  );
}
