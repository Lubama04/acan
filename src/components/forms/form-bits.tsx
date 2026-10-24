"use client";

import { useState, type ReactNode } from "react";
import type React from "react";

/** Honeypot (invisible to humans, announced as "leave empty" to screen readers) + start timestamp. */
export function AntiSpamFields() {
  // Captured once when the form first renders on the client.
  const [startedAt] = useState(() => Date.now());
  return (
    <>
      <div aria-hidden="true" className="absolute -start-[10000px] h-px w-px overflow-hidden">
        <label>
          Ne pas remplir ce champ
          <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>
      <input type="hidden" name="started_at" value={startedAt} />
    </>
  );
}

export function Field({
  id,
  label,
  error,
  hint,
  required,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
        {required ? (
          <span className="text-destructive" aria-hidden="true">
            {" "}
            *
          </span>
        ) : (
          <span className="text-slate font-normal"> (facultatif)</span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, error?: string, hint?: string) {
  return error ? `${id}-error` : hint ? `${id}-hint` : undefined;
}

export function FormStatus({ state }: { state: { status: string; message?: string } }) {
  if (state.status === "idle") return null;
  const ok = state.status === "success";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`rounded-md border p-4 font-semibold ${ok ? "border-[#1F7A4D] bg-[#EEF7F1] text-[#14532D]" : "border-destructive text-destructive bg-[#FEF3F2]"}`}
    >
      {state.message}
    </div>
  );
}

/**
 * React 19 resets uncontrolled form fields after every form action, which would wipe what the
 * visitor typed when the server returns a validation error. Submitting through onSubmit keeps it.
 */
export function keepValuesOnSubmit(
  dispatch: (fd: FormData) => void,
  startTransition: (cb: () => void) => void,
) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
}
