"use client";

import { useId, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-[2px] border border-sand-deep bg-white/70 px-3.5 text-[0.95rem] text-chocolate placeholder:text-bark/70 transition-colors hover:border-bark/60 focus:border-chocolate focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 aria-[invalid=true]:border-danger disabled:opacity-60";

interface FieldProps {
  label: string;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  className?: string;
}

/** Accessible text input: label, hint and error are all programmatically associated. */
export function TextField({ label, hint, error, optional, className, id, ...props }: FieldProps & ComponentProps<"input">) {
  const auto = useId();
  const inputId = id ?? auto;
  const describedBy = [hint && `${inputId}-hint`, error && `${inputId}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="flex items-baseline justify-between text-sm font-semibold">
        {label}
        {optional && <span className="text-xs font-normal text-bark">Optional</span>}
      </label>
      <input id={inputId} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className={cn(control, "h-11")} {...props} />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-bark">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextArea({ label, hint, error, optional, className, id, ...props }: FieldProps & ComponentProps<"textarea">) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="flex items-baseline justify-between text-sm font-semibold">
        {label}
        {optional && <span className="text-xs font-normal text-bark">Optional</span>}
      </label>
      <textarea
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={hint ? `${inputId}-hint` : undefined}
        className={cn(control, "min-h-24 py-2.5")}
        {...props}
      />
      {hint && (
        <p id={`${inputId}-hint`} className="text-xs text-bark">
          {hint}
        </p>
      )}
      {error && <p className="text-xs font-medium text-danger">{error}</p>}
    </div>
  );
}

export function SelectField({ label, className, id, children, ...props }: FieldProps & ComponentProps<"select">) {
  const auto = useId();
  const inputId = id ?? auto;
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={inputId} className="text-sm font-semibold">
        {label}
      </label>
      <select id={inputId} className={cn(control, "h-11 appearance-none bg-[length:12px] pr-9")} {...props}>
        {children}
      </select>
    </div>
  );
}

export function Checkbox({ label, description, className, ...props }: { label: ReactNode; description?: ReactNode } & ComponentProps<"input">) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3 text-sm", className)}>
      <input
        type="checkbox"
        className="mt-0.5 size-4.5 shrink-0 cursor-pointer appearance-none rounded-[2px] border border-bark bg-white checked:border-terracotta checked:bg-terracotta checked:bg-[url('data:image/svg+xml;utf8,<svg%20xmlns=%22http://www.w3.org/2000/svg%22%20viewBox=%220%200%2016%2016%22%20fill=%22none%22%20stroke=%22white%22%20stroke-width=%222.5%22><path%20d=%22M3.5%208.5l3%203%206-7%22/></svg>')] bg-center bg-no-repeat"
        {...props}
      />
      <span>
        <span className="font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-bark">{description}</span>}
      </span>
    </label>
  );
}
