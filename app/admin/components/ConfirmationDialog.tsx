"use client";

import { AlertTriangle, X } from "lucide-react";

interface ConfirmationDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationDialog({
  open,
  title = "Are you sure you want to proceed?",
  description = "Please confirm that you want to continue with this action.",
  confirmText = "Continue",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
        className="w-full max-w-md rounded-xl border border-stone-200 bg-white p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <AlertTriangle className="h-5 w-5 text-amber-700" />
          </div>

          <div className="min-w-0 flex-1">
            <h2
              id="confirmation-dialog-title"
              className="font-serif text-base font-semibold text-stone-900"
            >
              {title}
            </h2>

            <p
              id="confirmation-dialog-description"
              className="mt-1.5 text-sm leading-5 text-stone-500"
            >
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-md p-1.5 text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ACTIONS */}
        <div className="mt-6 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-stone-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-stone-800"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}