"use client";

import { useEffect, useState } from "react";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  defaultName: string;
  onSave: (name: string) => void;
}

export function SaveRequestModal({ open, onClose, defaultName, onSave }: Props) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  const submit = () => {
    const trimmed = name.trim();
    if (trimmed === "") return;
    onSave(trimmed);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Save request"
      description="Saved requests live in your browser and appear in the Collection."
      maxWidth="max-w-md"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-outline py-1.5">
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={name.trim() === ""} className="btn-primary py-1.5">
            Save
          </button>
        </>
      }
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Request name"
        autoFocus
        className="input-base"
      />
    </Modal>
  );
}
