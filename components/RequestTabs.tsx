"use client";

import { useState } from "react";
import type { AuthState, BodyMode, KeyValue, RequestState } from "@/lib/types";
import { AuthEditor } from "./AuthEditor";
import { BodyEditor } from "./BodyEditor";
import { KeyValueEditor } from "./KeyValueEditor";

interface Props {
  request: RequestState;
  onParamsChange: (rows: KeyValue[]) => void;
  onHeadersChange: (rows: KeyValue[]) => void;
  onAuthChange: (auth: AuthState) => void;
  onBodyModeChange: (mode: BodyMode) => void;
  onBodyChange: (body: string) => void;
}

type TabId = "params" | "headers" | "auth" | "body";

function activeCount(rows: KeyValue[]): number {
  return rows.filter((r) => r.enabled && r.key.trim() !== "").length;
}

export function RequestTabs({
  request,
  onParamsChange,
  onHeadersChange,
  onAuthChange,
  onBodyModeChange,
  onBodyChange,
}: Props) {
  const [tab, setTab] = useState<TabId>("params");

  const paramCount = activeCount(request.params);
  const headerCount = activeCount(request.headers);
  const authActive = request.auth.mode !== "none";
  const bodyActive = request.bodyMode !== "none" && request.body.trim() !== "";

  const tabs: { id: TabId; label: string; badge?: number; dot?: boolean }[] = [
    { id: "params", label: "Params", badge: paramCount || undefined },
    { id: "headers", label: "Headers", badge: headerCount || undefined },
    { id: "auth", label: "Auth", dot: authActive },
    { id: "body", label: "Body", dot: bodyActive },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className="flex items-center gap-1 border-b border-border px-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition ${
              tab === t.id ? "text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {t.label}
            {t.badge != null && (
              <span className="rounded-full bg-accent-soft px-1.5 text-[11px] text-info">
                {t.badge}
              </span>
            )}
            {t.dot && <span className="size-1.5 rounded-full bg-accent" />}
            {tab === t.id && (
              <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
            )}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto p-4">
        {tab === "params" && (
          <KeyValueEditor
            rows={request.params}
            onChange={onParamsChange}
            keyPlaceholder="Parameter"
            valuePlaceholder="Value"
          />
        )}
        {tab === "headers" && (
          <KeyValueEditor
            rows={request.headers}
            onChange={onHeadersChange}
            keyPlaceholder="Header"
            valuePlaceholder="Value"
          />
        )}
        {tab === "auth" && <AuthEditor auth={request.auth} onChange={onAuthChange} />}
        {tab === "body" && (
          <BodyEditor
            mode={request.bodyMode}
            body={request.body}
            onModeChange={onBodyModeChange}
            onBodyChange={onBodyChange}
          />
        )}
      </div>
    </div>
  );
}
