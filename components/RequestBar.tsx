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
    <div className="flex items-stretch gap-1.5 rounded-xl border border-line bg-elevated p-1.5 transition focus-within:border-line-strong">
      <div className="relative flex items-center">
        <select
          value={method}
          onChange={(e) => onMethodChange(e.target.value as HttpMethod)}
          aria-label="HTTP method"
          className={`h-full cursor-pointer appearance-none rounded-lg bg-raised py-2 pl-3.5 pr-9 font-mono text-[13px] font-bold tracking-wide outline-none transition hover:bg-overlay focus-visible:ring-2 focus-visible:ring-white/10 ${methodColor(
            method,
          )}`}
        >
          {HTTP_METHODS.map((m) => (
            <option key={m} value={m} className="bg-overlay font-sans font-semibold text-fg">
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
        className="min-w-0 flex-1 bg-transparent px-2 font-mono text-sm text-fg outline-none placeholder:text-faint"
      />

      <button type="button" onClick={onSend} disabled={!canSend} className="btn-primary px-5">
        {loading ? <SpinnerIcon width={15} height={15} /> : <SendIcon width={15} height={15} />}
        <span>{loading ? "Sending" : "Send"}</span>
        <span className="hidden rounded bg-black/10 px-1.5 py-0.5 font-mono text-[10px] leading-none text-on-primary/60 sm:inline">
          ⌘↵
        </span>
      </button>
    </div>
  );
}
