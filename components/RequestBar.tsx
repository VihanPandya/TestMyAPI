"use client";

import { methodColor } from "@/lib/methodColor";
import { HTTP_METHODS, type HttpMethod } from "@/lib/types";
import { SendIcon, SpinnerIcon } from "./icons";

interface Props {
  method: HttpMethod;
  url: string;
  loading: boolean;
  onMethodChange: (method: HttpMethod) => void;
  onUrlChange: (url: string) => void;
  onSend: () => void;
}

export function RequestBar({
  method,
  url,
  loading,
  onMethodChange,
  onUrlChange,
  onSend,
}: Props) {
  const canSend = !loading && url.trim() !== "";

  return (
    <div className="flex items-stretch gap-2 rounded-lg border border-border bg-panel p-1.5">
      <div className="relative">
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
          aria-label="HTTP method"
          className={`h-full cursor-pointer appearance-none rounded-md bg-panel-2 py-2 pl-3 pr-8 text-sm font-bold outline-none transition focus:ring-1 focus:ring-accent ${methodColor(
            method,
          )}`}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m} className="bg-panel font-bold text-fg">
              {m}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-faint">
          ▾
        </span>
      </div>

      <input
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (canSend) onSend();
          }
        }}
        placeholder="https://api.example.com/endpoint"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        aria-label="Request URL"
        className="min-w-0 flex-1 bg-transparent px-2 font-mono text-sm text-fg outline-none placeholder:text-faint"
      />

      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        className="inline-flex items-center gap-2 rounded-md bg-accent px-5 py-2 text-sm font-semibold text-accent-fg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <SpinnerIcon width={15} height={15} /> : <SendIcon width={15} height={15} />}
        <span>{loading ? "Sending" : "Send"}</span>
      </button>
    </div>
  );
}
