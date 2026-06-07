"use client";

import { emptyRow, withTrailingRow } from "@/lib/request";
import type { KeyValue } from "@/lib/types";
import { TrashIcon } from "./icons";

interface Props {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export function KeyValueEditor({
  rows,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: Props) {
  const update = (id: string, patch: Partial<KeyValue>) => {
    onChange(withTrailingRow(rows.map((r) => (r.id === id ? { ...r, ...patch } : r))));
  };

  const remove = (id: string) => {
    const next = rows.filter((r) => r.id !== id);
    onChange(next.length > 0 ? next : [emptyRow()]);
  };

  return (
    <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
      {rows.map((row) => {
        const isBlank = row.key === "" && row.value === "";
        return (
          <div key={row.id} className="group flex items-center gap-2 bg-panel-2/40 px-2">
            <input
              type="checkbox"
              checked={row.enabled}
              onChange={(e) => update(row.id, { enabled: e.target.checked })}
              disabled={isBlank}
              aria-label="Enable row"
              className="size-3.5 shrink-0 cursor-pointer accent-accent disabled:opacity-30"
            />
            <input
              value={row.key}
              onChange={(e) => update(row.id, { key: e.target.value })}
              placeholder={keyPlaceholder}
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-2 font-mono text-[13px] text-fg outline-none placeholder:text-faint"
            />
            <span className="text-faint">:</span>
            <input
              value={row.value}
              onChange={(e) => update(row.id, { value: e.target.value })}
              placeholder={valuePlaceholder}
              spellCheck={false}
              autoComplete="off"
              className="min-w-0 flex-[1.4] bg-transparent py-2 font-mono text-[13px] text-fg outline-none placeholder:text-faint"
            />
            <button
              type="button"
              onClick={() => remove(row.id)}
              aria-label="Remove row"
              className={`shrink-0 rounded p-1 text-faint transition hover:text-danger ${
                isBlank ? "invisible" : "opacity-0 group-hover:opacity-100"
              }`}
            >
              <TrashIcon width={14} height={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
