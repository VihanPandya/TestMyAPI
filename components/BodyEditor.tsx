"use client";

import { tryPrettyJson } from "@/lib/format";
import type { BodyMode } from "@/lib/types";

interface Props {
  mode: BodyMode;
  body: string;
  onModeChange: (mode: BodyMode) => void;
  onBodyChange: (body: string) => void;
}

const MODES: { value: BodyMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "json", label: "JSON" },
  { value: "text", label: "Text" },
];

function jsonValidity(body: string): "empty" | "valid" | "invalid" {
  if (body.trim() === "") return "empty";
  try {
    JSON.parse(body);
    return "valid";
  } catch {
    return "invalid";
  }
}

export function BodyEditor({ mode, body, onModeChange, onBodyChange }: Props) {
  const validity = mode === "json" ? jsonValidity(body) : "empty";

  const format = () => {
    const { pretty, isJson } = tryPrettyJson(body);
    if (isJson) onBodyChange(pretty);
  };

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-md border border-border p-0.5">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => onModeChange(m.value)}
              className={`rounded px-3 py-1 text-xs font-medium transition ${
                mode === m.value ? "bg-accent-soft text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "json" && (
          <div className="flex items-center gap-3">
            {validity !== "empty" && (
              <span
                className={`text-xs ${validity === "valid" ? "text-success" : "text-danger"}`}
              >
                {validity === "valid" ? "Valid JSON" : "Invalid JSON"}
              </span>
            )}
            <button
              type="button"
              onClick={format}
              disabled={validity !== "valid"}
              className="btn-ghost text-xs"
            >
              Format
            </button>
          </div>
        )}
      </div>

      {mode === "none" ? (
        <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border text-sm text-faint">
          This request has no body.
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={mode === "json" ? '{\n  "key": "value"\n}' : "Request body"}
          spellCheck={false}
          className="min-h-[180px] flex-1 resize-none rounded-md border border-border bg-panel-2 p-3 font-mono text-[13px] leading-relaxed text-fg outline-none transition placeholder:text-faint focus:border-accent focus:ring-1 focus:ring-accent"
        />
      )}
    </div>
  );
}
