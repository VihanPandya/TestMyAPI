"use client";

import { useState } from "react";
import type { AuthState, BodyMode, KeyValue, RequestState } from "@/lib/types";
import { AuthEditor } from "./AuthEditor";
import { BodyEditor } from "./BodyEditor";
import { KeyValueEditor } from "./KeyValueEditor";

interface Props {
  request: RequestState;
  actions?: React.ReactNode;
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
  actions,
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
      <div className="flex items-center justify-between border-b border-line pl-3 pr-2">
        <div role="tablist" className="flex items-center gap-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`relative flex items-center gap-1.5 py-3 text-[13px] font-medium transition ${
                tab === t.id ? "text-fg" : "text-faint hover:text-muted"
              }`}
            >
              {t.label}
              {t.badge != null && <span className="text-[11px] text-faint">{t.badge}</span>}
              {t.dot && <span className="size-1.5 rounded-full bg-fg" />}
              {tab === t.id && <span className="absolute inset-x-0 -bottom-px h-px bg-fg" />}
            </button>
          ))}
        </div>
        {actions && <div className="flex items-center gap-0.5">{actions}</div>}
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
