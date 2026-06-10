"use client";

import { useEffect, useState } from "react";
import { parseCurl } from "@/lib/curl";
import type { RequestState } from "@/lib/types";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onImport: (request: RequestState) => void;
}

export function ImportCurlModal({ open, onClose, onImport }: Props) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setText("");
      setError(null);
    }
  }, [open]);

  const submit = () => {
    const parsed = parseCurl(text);
    if (!parsed) {
      setError("Couldn't find a URL in that command. Paste a full curl command.");
      return;
    }
    onImport(parsed);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import from cURL"
      description="Paste a curl command — method, URL, headers, body and basic auth are imported."
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-outline py-1.5">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={text.trim() === ""} className="btn-primary py-1.5">
            Import
          </button>
        </>
      }
    >
      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit();
        }}
        placeholder={"curl https://api.example.com/v1/users \\\n  -H 'Authorization: Bearer …'"}
        spellCheck={false}
        autoFocus
        rows={6}
        className="w-full resize-none rounded-lg border border-line bg-bg p-3 font-mono text-[13px] leading-relaxed text-fg outline-none placeholder:text-faint focus-visible:border-line-strong focus-visible:ring-2 focus-visible:ring-white/10"
      />
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Modal>
  );
}
