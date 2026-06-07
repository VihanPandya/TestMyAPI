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
        <div className="seg">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              data-active={mode === m.value}
              onClick={() => onModeChange(m.value)}
              className="seg-btn"
            >
              {m.label}
            </button>
          ))}
        </div>

        {mode === "json" && (
          <div className="flex items-center gap-3">
            {validity !== "empty" && (
              <span className={`text-xs ${validity === "valid" ? "text-success" : "text-danger"}`}>
                {validity === "valid" ? "Valid JSON" : "Invalid JSON"}
              </span>
            )}
            <button type="button" onClick={format} disabled={validity !== "valid"} className="btn-ghost text-xs">
              Format
            </button>
          </div>
        )}
      </div>

      {mode === "none" ? (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-line text-sm text-faint">
          This request has no body.
        </div>
      ) : (
        <textarea
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={mode === "json" ? '{\n  "key": "value"\n}' : "Request body"}
          spellCheck={false}
          className="min-h-[180px] flex-1 resize-none rounded-lg border border-line bg-bg p-3 font-mono text-[13px] leading-relaxed text-fg outline-none transition placeholder:text-faint focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-white/10"
        />
      )}
    </div>
  );
}
