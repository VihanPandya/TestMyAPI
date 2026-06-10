"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CodeModal } from "@/components/CodeModal";
import { CommandPalette, type Command } from "@/components/CommandPalette";
import {
  BookmarkIcon,
  CloseIcon,
  CodeIcon,
  GitHubIcon,
  ImportIcon,
  LogoMark,
  SearchIcon,
  SidebarIcon,
} from "@/components/icons";
import { ImportCurlModal } from "@/components/ImportCurlModal";
import { RequestBar } from "@/components/RequestBar";
import { RequestTabs } from "@/components/RequestTabs";
import { ResponseView } from "@/components/ResponseView";
import { SaveRequestModal } from "@/components/SaveRequestModal";
import { Sidebar } from "@/components/Sidebar";
import { toCurl, toFetch } from "@/lib/codegen";
import {
  buildUrl,
  createRequestState,
  paramsFromUrl,
  toProxyRequest,
  uid,
} from "@/lib/request";
import {
  addHistoryEntry,
  loadHistory,
  loadSaved,
  saveHistory,
  saveSaved,
} from "@/lib/storage";
import { HTTP_METHODS } from "@/lib/types";
import type {
  AuthState,
  BodyMode,
  HistoryEntry,
  HttpMethod,
  KeyValue,
  ProxyError,
  ProxyResponse,
  RequestState,
  SavedRequest,
} from "@/lib/types";

const REPO_URL = "https://github.com/VihanPandya/TestMyAPI";

function defaultSaveName(r: RequestState): string {
  try {
    const u = new URL(r.url);
    return `${r.method} ${u.pathname === "/" ? u.host : u.pathname}`;
  } catch {
    return `${r.method} request`;
  }
}

export default function Home() {
  const [request, setRequest] = useState<RequestState>(createRequestState);
  const [response, setResponse] = useState<ProxyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [saved, setSaved] = useState<SavedRequest[]>([]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const requestRef = useRef(request);
  const loadingRef = useRef(loading);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => {
    requestRef.current = request;
  }, [request]);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    setHistory(loadHistory());
    setSaved(loadSaved());
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }, []);

  const copyText = useCallback(
    async (text: string, label: string) => {
      try {
        await navigator.clipboard.writeText(text);
        showToast(`${label} copied`);
      } catch {
        showToast("Copy failed");
      }
    },
    [showToast],
  );

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

  const loadRequest = useCallback((next: RequestState) => {
    setRequest(next);
    setResponse(null);
    setError(null);
    setDrawerOpen(false);
  }, []);

  const persistSaved = useCallback((updater: (prev: SavedRequest[]) => SavedRequest[]) => {
    setSaved((prev) => {
      const next = updater(prev);
      saveSaved(next);
      return next;
    });
  }, []);

  const doSave = useCallback(
    (name: string) => {
      const entry: SavedRequest = {
        id: uid(),
        name,
        createdAt: Date.now(),
        request: requestRef.current,
      };
      persistSaved((prev) => [entry, ...prev]);
      showToast("Request saved");
    },
    [persistSaved, showToast],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    saveHistory([]);
  }, []);

  const focusUrl = useCallback(() => {
    const el = document.querySelector<HTMLInputElement>('input[aria-label="Request URL"]');
    el?.focus();
    el?.select();
  }, []);

  const onUrlChange = useCallback(
    (url: string) => patch({ url, params: paramsFromUrl(url) }),
    [patch],
  );
  const onParamsChange = useCallback(
    (params: KeyValue[]) => setRequest((prev) => ({ ...prev, params, url: buildUrl(prev.url, params) })),
    [],
  );
  const onHeadersChange = useCallback((headers: KeyValue[]) => patch({ headers }), [patch]);
  const onAuthChange = useCallback((auth: AuthState) => patch({ auth }), [patch]);
  const onBodyModeChange = useCallback((bodyMode: BodyMode) => patch({ bodyMode }), [patch]);
  const onBodyChange = useCallback((body: string) => patch({ body }), [patch]);
  const onMethodChange = useCallback((method: HttpMethod) => patch({ method }), [patch]);

  const overlayOpen = paletteOpen || importOpen || codeOpen || saveOpen;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        if (!importOpen && !codeOpen && !saveOpen) setPaletteOpen((o) => !o);
        return;
      }
      if (overlayOpen) return;
      if (mod && e.key === "Enter") {
        e.preventDefault();
        void send();
      } else if (mod && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        setSaveOpen(true);
      } else if (mod && (e.key === "l" || e.key === "L")) {
        e.preventDefault();
        focusUrl();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [send, focusUrl, overlayOpen, importOpen, codeOpen, saveOpen]);

  const commands: Command[] = [
    { id: "send", section: "Request", label: "Send request", hint: "⌘↵", keywords: "run execute", run: () => void send() },
    { id: "save", section: "Request", label: "Save request", hint: "⌘S", keywords: "bookmark collection", run: () => setSaveOpen(true) },
    { id: "focus-url", section: "Request", label: "Focus URL", hint: "⌘L", keywords: "address edit", run: focusUrl },
    { id: "clear-response", section: "Request", label: "Clear response", keywords: "reset", run: () => { setResponse(null); setError(null); } },
    { id: "import", section: "Tools", label: "Import from cURL…", keywords: "paste curl", run: () => setImportOpen(true) },
    { id: "code", section: "Tools", label: "View code (cURL / fetch)…", keywords: "generate export snippet", run: () => setCodeOpen(true) },
    { id: "copy-curl", section: "Tools", label: "Copy as cURL", keywords: "clipboard export", run: () => void copyText(toCurl(requestRef.current), "cURL") },
    { id: "copy-fetch", section: "Tools", label: "Copy as fetch", keywords: "clipboard javascript export", run: () => void copyText(toFetch(requestRef.current), "fetch snippet") },
    ...HTTP_METHODS.map((m) => ({
      id: `method-${m}`,
      section: "Set method",
      label: m,
      keywords: "method verb",
      run: () => onMethodChange(m),
    })),
  ];

  const requestActions = (
    <>
      <button type="button" onClick={() => setImportOpen(true)} className="btn-ghost px-2 py-1.5 text-xs" title="Import from cURL">
        <ImportIcon width={14} height={14} />
        <span className="hidden md:inline">Import</span>
      </button>
      <button type="button" onClick={() => setCodeOpen(true)} className="btn-ghost px-2 py-1.5 text-xs" title="View code">
        <CodeIcon width={14} height={14} />
        <span className="hidden md:inline">Code</span>
      </button>
      <button type="button" onClick={() => setSaveOpen(true)} className="btn-ghost px-2 py-1.5 text-xs" title="Save request (⌘S)">
        <BookmarkIcon width={14} height={14} />
        <span className="hidden md:inline">Save</span>
      </button>
    </>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <header className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="btn-ghost -ml-1.5 lg:hidden"
            aria-label="Open sidebar"
          >
            <SidebarIcon width={17} height={17} />
          </button>
          <div className="flex items-center gap-2.5">
            <LogoMark className="text-fg" />
            <div className="flex items-baseline gap-2">
              <h1 className="text-[15px] font-semibold tracking-tight text-fg">TestMyAPI</h1>
              <span className="hidden font-mono text-[11px] text-faint sm:inline">/ playground</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="btn-outline gap-2 py-1.5 text-muted"
            aria-label="Open command palette"
          >
            <SearchIcon width={14} height={14} />
            <span className="hidden sm:inline">Commands</span>
            <kbd className="kbd hidden sm:inline-flex">⌘K</kbd>
          </button>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="btn-ghost"
            aria-label="View source on GitHub"
          >
            <GitHubIcon width={17} height={17} />
          </a>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="hidden w-72 shrink-0 lg:block">
          <Sidebar
            saved={saved}
            history={history}
            onRestoreSaved={(s) => loadRequest(s.request)}
            onDeleteSaved={(id) => persistSaved((prev) => prev.filter((s) => s.id !== id))}
            onRestoreHistory={(h) => loadRequest(h.request)}
            onClearHistory={clearHistory}
          />
        </div>

        <main className="flex min-h-0 flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
          <RequestBar
            method={request.method}
            url={request.url}
            loading={loading}
            onMethodChange={onMethodChange}
            onUrlChange={onUrlChange}
            onSend={send}
          />

          <div className="grid min-h-0 flex-1 grid-rows-2 gap-3 sm:gap-4 lg:grid-cols-2 lg:grid-rows-1">
            <section className="panel flex min-h-0 flex-col overflow-hidden">
              <RequestTabs
                request={request}
                actions={requestActions}
                onParamsChange={onParamsChange}
                onHeadersChange={onHeadersChange}
                onAuthChange={onAuthChange}
                onBodyModeChange={onBodyModeChange}
                onBodyChange={onBodyChange}
              />
            </section>

            <section className="panel flex min-h-0 flex-col overflow-hidden">
              <ResponseView response={response} error={error} loading={loading} />
            </section>
          </div>
        </main>
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close sidebar"
          />
          <div className="relative z-10 w-72 max-w-[80vw] bg-bg">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              className="btn-ghost absolute right-2 top-2.5 z-10"
              aria-label="Close sidebar"
            >
              <CloseIcon width={17} height={17} />
            </button>
            <Sidebar
              saved={saved}
              history={history}
              onRestoreSaved={(s) => loadRequest(s.request)}
              onDeleteSaved={(id) => persistSaved((prev) => prev.filter((s) => s.id !== id))}
              onRestoreHistory={(h) => loadRequest(h.request)}
              onClearHistory={clearHistory}
            />
          </div>
        </div>
      )}

      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
          <div className="rounded-lg border border-line bg-overlay px-3.5 py-2 text-sm text-fg shadow-[0_12px_40px_-12px_rgb(0_0_0/0.7)]">
            {toast}
          </div>
        </div>
      )}

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />
      <ImportCurlModal open={importOpen} onClose={() => setImportOpen(false)} onImport={loadRequest} />
      <CodeModal open={codeOpen} onClose={() => setCodeOpen(false)} request={request} />
      <SaveRequestModal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        defaultName={defaultSaveName(request)}
        onSave={doSave}
      />
    </div>
  );
}
