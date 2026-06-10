"use client";

import { useMemo, useState } from "react";
import { CODEGEN_TARGETS, generate, type CodegenTarget } from "@/lib/codegen";
import type { RequestState } from "@/lib/types";
import { CheckIcon, CopyIcon } from "./icons";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  request: RequestState;
}

export function CodeModal({ open, onClose, request }: Props) {
  const [target, setTarget] = useState<CodegenTarget>("curl");
  const [copied, setCopied] = useState(false);

  const code = useMemo(() => (open ? generate(target, request) : ""), [open, target, request]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Copy as code" maxWidth="max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="seg">
          {CODEGEN_TARGETS.map((t) => (
            <button
              key={t.id}
              type="button"
              data-active={target === t.id}
              onClick={() => setTarget(t.id)}
              className="seg-btn"
            >
              {t.label}
            </button>
          ))}
        </div>
        <button type="button" onClick={copy} className="btn-outline py-1.5">
          {copied ? (
            <CheckIcon width={14} height={14} className="text-success" />
          ) : (
            <CopyIcon width={14} height={14} />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[50vh] overflow-auto rounded-lg border border-line bg-bg p-4 font-mono text-[13px] leading-relaxed text-fg">
        {code}
      </pre>
    </Modal>
  );
}
