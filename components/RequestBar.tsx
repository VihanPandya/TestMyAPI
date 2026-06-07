"use client";

import { methodColor } from "@/lib/methodColor";
import { HTTP_METHODS, type HttpMethod } from "@/lib/types";
import { ChevronDownIcon, SendIcon, SpinnerIcon } from "./icons";

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
    <div className="flex items-stretch gap-1 rounded-xl border border-border bg-panel p-1.5 shadow-[0_1px_2px_0_rgb(0_0_0/0.3)] transition focus-within:border-border-strong">
      <div className="relative flex items-center">
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
          aria-label="HTTP method"
          className={`h-full cursor-pointer appearance-none rounded-lg bg-panel-2 py-2 pl-3.5 pr-9 font-mono text-[13px] font-bold tracking-wide outline-none transition hover:bg-panel-3 focus:ring-2 focus:ring-accent/25 ${methodColor(
            method,
          )}`}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m} className="bg-panel font-sans font-semibold text-fg">
              {m}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          width={14}
          height={14}
          className="pointer-events-none absolute right-3 text-faint"
        />
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
        placeholder="https://api.example.com/v1/resource"
        spellCheck={false}
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        aria-label="Request URL"
        className="min-w-0 flex-1 bg-transparent px-3 font-mono text-sm text-fg outline-none placeholder:text-faint"
      />

      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-fg shadow-[inset_0_1px_0_0_rgb(255_255_255/0.18),0_8px_20px_-10px_rgb(124_120_255/0.7)] transition hover:bg-accent-bright disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
      >
        {loading ? <SpinnerIcon width={15} height={15} /> : <SendIcon width={15} height={15} />}
        <span>{loading ? "Sending" : "Send"}</span>
        <span className="hidden rounded bg-white/15 px-1.5 py-0.5 font-mono text-[10px] leading-none text-white/80 sm:inline">
          ⌘↵
        </span>
      </button>
    </div>
  );
}
