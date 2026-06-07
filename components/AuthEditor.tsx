"use client";

import type { AuthMode, AuthState } from "@/lib/types";

interface Props {
  auth: AuthState;
  onChange: (auth: AuthState) => void;
}

const MODES: { value: AuthMode; label: string }[] = [
  { value: "none", label: "None" },
  { value: "bearer", label: "Bearer" },
  { value: "basic", label: "Basic" },
];

export function AuthEditor({ auth, onChange }: Props) {
  const set = (patch: Partial<AuthState>) => onChange({ ...auth, ...patch });

  return (
    <div className="flex flex-col gap-4">
      <div className="inline-flex w-fit rounded-md border border-border p-0.5">
        {MODES.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => set({ mode: m.value })}
            className={`rounded px-3 py-1 text-xs font-medium transition ${
              auth.mode === m.value ? "bg-accent-soft text-fg" : "text-muted hover:text-fg"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {auth.mode === "none" && (
        <p className="text-sm text-faint">No authorization will be sent with this request.</p>
      )}

      {auth.mode === "bearer" && (
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Token</span>
          <input
            value={auth.token}
            onChange={(e) => set({ token: e.target.value })}
            placeholder="your-access-token"
            spellCheck={false}
            autoComplete="off"
            className="input-base font-mono"
          />
          <span className="text-xs text-faint">
            Sent as <code className="text-muted">Authorization: Bearer …</code>
          </span>
        </label>
      )}

      {auth.mode === "basic" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Username</span>
            <input
              value={auth.username}
              onChange={(e) => set({ username: e.target.value })}
              spellCheck={false}
              autoComplete="off"
              className="input-base font-mono"
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted">Password</span>
            <input
              type="password"
              value={auth.password}
              onChange={(e) => set({ password: e.target.value })}
              autoComplete="off"
              className="input-base font-mono"
            />
          </label>
        </div>
      )}
    </div>
  );
}
