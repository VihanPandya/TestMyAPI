"use client";

import { useMemo, useState } from "react";
import {
  formatBytes,
  formatDuration,
  mediaType,
  statusKind,
  tryPrettyJson,
  type StatusKind,
} from "@/lib/format";
import type { ProxyResponse } from "@/lib/types";
import { CheckIcon, CopyIcon, SpinnerIcon } from "./icons";

interface Props {
  response: ProxyResponse | null;
  error: string | null;
  loading: boolean;
}

const STATUS_COLOR: Record<StatusKind, string> = {
  success: "text-success",
  redirect: "text-info",
  "client-error": "text-warning",
  "server-error": "text-danger",
  info: "text-muted",
  unknown: "text-muted",
};

type ResponseTab = "body" | "headers";

function headerValue(headers: Array<[string, string]>, name: string): string | undefined {
  const found = headers.find(([k]) => k.toLowerCase() === name.toLowerCase());
  return found?.[1];
}

export function ResponseView({ response, error, loading }: Props) {
  const [tab, setTab] = useState<ResponseTab>("body");
  const [raw, setRaw] = useState(false);
  const [copied, setCopied] = useState(false);

  const { pretty, isJson } = useMemo(
    () => (response ? tryPrettyJson(response.body) : { pretty: "", isJson: false }),
    [response],
  );

  if (loading && !response) {
    return (
      <Centered>
        <SpinnerIcon width={22} height={22} className="text-accent" />
        <p className="mt-3 text-sm text-muted">Waiting for response…</p>
      </Centered>
    );
  }

  if (error) {
    return (
      <Centered>
        <div className="max-w-md rounded-lg border border-danger/30 bg-danger/5 px-5 py-4 text-center">
          <p className="text-sm font-semibold text-danger">Request failed</p>
          <p className="mt-1.5 text-sm text-muted">{error}</p>
        </div>
      </Centered>
    );
  }

  if (!response) {
    return (
      <Centered>
        <p className="text-sm text-faint">Send a request to see the response here.</p>
      </Centered>
    );
  }

  const contentType = mediaType(headerValue(response.headers, "content-type"));
  const showRawToggle = isJson;
  const displayed = !raw && isJson ? pretty : response.body;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(displayed);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // Clipboard may be unavailable; copy is a convenience only.
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 border-b border-border px-4 py-2.5 text-sm">
        <span className={`font-semibold ${STATUS_COLOR[statusKind(response.status)]}`}>
          {response.status} {response.statusText}
        </span>
        <Metric label="Time" value={formatDuration(response.timeMs)} />
        <Metric label="Size" value={formatBytes(response.size)} />
        {response.redirected && (
          <span className="rounded bg-accent-soft px-1.5 py-0.5 text-xs text-info">redirect</span>
        )}
        {response.truncated && (
          <span className="rounded bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
            truncated at 5 MB
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-b border-border pr-2">
        <div role="tablist" className="flex">
          {(["body", "headers"] as const).map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`relative px-4 py-2 text-sm font-medium capitalize transition ${
                tab === id ? "text-fg" : "text-muted hover:text-fg"
              }`}
            >
              {id}
              {id === "headers" && (
                <span className="ml-1.5 text-xs text-faint">{response.headers.length}</span>
              )}
              {tab === id && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>

        {tab === "body" && (
          <div className="flex items-center gap-2">
            {contentType && <span className="hidden text-xs text-faint sm:inline">{contentType}</span>}
            {showRawToggle && (
              <button
                type="button"
                onClick={() => setRaw((r) => !r)}
                className="btn-ghost text-xs"
              >
                {raw ? "Pretty" : "Raw"}
              </button>
            )}
            <button type="button" onClick={copy} className="btn-ghost text-xs">
              {copied ? (
                <CheckIcon width={13} height={13} className="text-success" />
              ) : (
                <CopyIcon width={13} height={13} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {tab === "body" ? (
          response.body === "" ? (
            <p className="p-4 text-sm italic text-faint">(empty response body)</p>
          ) : (
            <pre className="whitespace-pre-wrap break-words p-4 font-mono text-[13px] leading-relaxed text-fg">
              {displayed}
            </pre>
          )
        ) : (
          <dl className="divide-y divide-border">
            {response.headers.map(([key, value], i) => (
              <div key={`${key}-${i}`} className="grid grid-cols-1 gap-0.5 px-4 py-2 sm:grid-cols-3">
                <dt className="font-mono text-[13px] font-medium text-info">{key}</dt>
                <dd className="break-words font-mono text-[13px] text-muted sm:col-span-2">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-muted">
      {label} <span className="font-medium text-fg">{value}</span>
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">{children}</div>
  );
}
