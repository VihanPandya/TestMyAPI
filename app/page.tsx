"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { HistorySidebar } from "@/components/HistorySidebar";
import { CloseIcon, GitHubIcon, HistoryIcon, LogoMark } from "@/components/icons";
import { RequestBar } from "@/components/RequestBar";
import { RequestTabs } from "@/components/RequestTabs";
import { ResponseView } from "@/components/ResponseView";
import {
  buildUrl,
  createRequestState,
  paramsFromUrl,
  toProxyRequest,
  uid,
} from "@/lib/request";
import { addHistoryEntry, loadHistory, saveHistory } from "@/lib/storage";
import type {
  AuthState,
  BodyMode,
  HistoryEntry,
  HttpMethod,
  KeyValue,
  ProxyError,
  ProxyResponse,
  RequestState,
} from "@/lib/types";

const REPO_URL = "https://github.com/VihanPandya/TestMyAPI";

export default function Home() {
  const [request, setRequest] = useState<RequestState>(createRequestState);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  const requestRef = useRef(request);
  const loadingRef = useRef(loading);
  useEffect(() => {
    requestRef.current = request;
  }, [request]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const patch = useCallback((changes: Partial<RequestState>) => {
    setRequest((prev) => ({ ...prev, ...changes }));
  }, []);

  const send = useCallback(async () => {
    if (loadingRef.current) return;
    const payload = toProxyRequest(requestRef.current);
    if (payload.url === "") return;

    const sentRequest = requestRef.current;
    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: ProxyResponse | ProxyError = await res.json();

      if (!res.ok || "error" in data) {
        setError(("error" in data && data.error) || `Proxy returned ${res.status}.`);
        return;
      }

      setResponse(data);
      const entry: HistoryEntry = {
        id: uid(),
        method: sentRequest.method,
        url: sentRequest.url,
        status: data.status,
        timeMs: data.timeMs,
        createdAt: Date.now(),
        request: sentRequest,
      };
      setHistory((prev) => {
        const next = addHistoryEntry(prev, entry);
        saveHistory(next);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the proxy.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        void send();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [send]);

  const restore = useCallback((entry: HistoryEntry) => {
    setRequest(entry.request);
    setResponse(null);
    setError(null);
    setHistoryOpen(false);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const onUrlChange = useCallback(
    (url: string) => patch({ url, params: paramsFromUrl(url) }),
    [patch],
  );
  const onParamsChange = useCallback(
    (params: KeyValue[]) =>
      setRequest((prev) => ({ ...prev, params, url: buildUrl(prev.url, params) })),
    [],
  );
  const onHeadersChange = useCallback((headers: KeyValue[]) => patch({ headers }), [patch]);
  const onAuthChange = useCallback((auth: AuthState) => patch({ auth }), [patch]);
  const onBodyModeChange = useCallback((bodyMode: BodyMode) => patch({ bodyMode }), [patch]);
  const onBodyChange = useCallback((body: string) => patch({ body }), [patch]);
  const onMethodChange = useCallback((method: HttpMethod) => patch({ method }), [patch]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-border/70 bg-bg/60 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2.5">
          <LogoMark className="text-fg" />
          <div className="flex items-baseline gap-2">
            <h1 className="text-[15px] font-semibold tracking-tight text-fg">
              TestMy<span className="text-accent">API</span>
            </h1>
            <span className="hidden font-mono text-[11px] text-faint sm:inline">
              / request playground
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-ghost"
            aria-label="View source on GitHub"
          >
            <GitHubIcon width={17} height={17} />
          </a>
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="btn-ghost lg:hidden"
            aria-label="Open history"
          >
            <HistoryIcon width={17} height={17} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-72 shrink-0 lg:block">
          <HistorySidebar entries={history} onSelect={restore} onClear={clearHistory} />
        </div>

        <main className="flex min-h-0 flex-1 flex-col gap-4 p-4">
          <RequestBar
            method={request.method}
            url={request.url}
            loading={loading}
            onMethodChange={onMethodChange}
            onUrlChange={onUrlChange}
            onSend={send}
          />

          <div className="grid min-h-0 flex-1 grid-rows-2 gap-4 lg:grid-cols-2 lg:grid-rows-1">
            <section className="surface flex min-h-0 flex-col overflow-hidden">
              <RequestTabs
                request={request}
                onParamsChange={onParamsChange}
                onHeadersChange={onHeadersChange}
                onAuthChange={onAuthChange}
                onBodyModeChange={onBodyModeChange}
                onBodyChange={onBodyChange}
              />
            </section>

            <section className="surface flex min-h-0 flex-col overflow-hidden">
              <ResponseView response={response} error={error} loading={loading} />
            </section>
          </div>
        </main>
      </div>

      {historyOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setHistoryOpen(false)}
            aria-label="Close history"
          />
          <div className="relative z-10 w-72 max-w-[80vw]">
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="btn-ghost absolute right-2 top-2.5 z-10"
              aria-label="Close history"
            >
              <CloseIcon width={17} height={17} />
            </button>
            <HistorySidebar entries={history} onSelect={restore} onClear={clearHistory} />
          </div>
        </div>
      )}
    </div>
  );
}
