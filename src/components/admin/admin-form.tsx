"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useId, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/app/actions/result";
import { cn } from "@/lib/utils";

type FieldErrors = Record<string, string>;
const ErrorsContext = createContext<FieldErrors>({});
export const useFieldError = (name: string) => useContext(ErrorsContext)[name];

/**
 * Client wrapper for admin forms: submits FormData to a server action, shows toasts and
 * inline field errors, and refreshes the page data on success.
 */
export function AdminForm<T>({
  action,
  children,
  className,
  onSuccess,
  resetOnSuccess,
  confirm,
}: {
  action: (fd: FormData) => Promise<ActionResult<T>>;
  children: ReactNode;
  className?: string;
  onSuccess?: (data: T) => void;
  resetOnSuccess?: boolean;
  confirm?: string;
}) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <ErrorsContext.Provider value={errors}>
      <form
        className={cn(className, pending && "pointer-events-none opacity-70")}
        aria-busy={pending}
        onSubmit={(e) => {
          e.preventDefault();
          if (confirm && !window.confirm(confirm)) return;
          const form = e.currentTarget;
          // Include the clicked submit button's name/value (e.g. status="APPROVED").
          const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          const fd = new FormData(form, submitter ?? undefined);
          start(async () => {
            const r = await action(fd);
            if (!r.ok) {
              setErrors(r.fieldErrors ?? {});
              toast.error(r.error);
              return;
            }
            setErrors({});
            toast.success(r.message ?? "Saved");
            if (resetOnSuccess) form.reset();
            onSuccess?.(r.data);
            router.refresh();
          });
        }}
      >
        {children}
      </form>
    </ErrorsContext.Provider>
  );
}

export function FieldError({ name }: { name: string }) {
  const err = useFieldError(name);
  return err ? (
    <p role="alert" className="mt-1 text-xs font-medium text-danger">
      {err}
    </p>
  ) : null;
}

const ctl =
  "w-full rounded-[2px] border border-sand-deep bg-white px-3 text-sm text-chocolate focus:border-chocolate focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/30 aria-[invalid=true]:border-danger";

export function F({
  label,
  name,
  hint,
  type = "text",
  defaultValue,
  required,
  className,
  ...rest
}: { label: string; name: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const err = useFieldError(name);
  const id = `f-${name}-${useId()}`;
  if (type === "checkbox")
    return (
      <label className={cn("flex items-start gap-2.5 text-sm", className)}>
        <input type="checkbox" name={name} defaultChecked={!!defaultValue} className="mt-0.5 size-4 accent-terracotta" {...rest} />
        <span>
          <span className="font-semibold">{label}</span>
          {hint && <span className="block text-xs text-bark">{hint}</span>}
        </span>
      </label>
    );
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
        {required && <span className="text-danger"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        defaultValue={defaultValue}
        aria-invalid={err ? true : undefined}
        className={cn(ctl, "h-10")}
        {...rest}
      />
      {hint && !err && <p className="mt-1 text-xs text-bark">{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

export function FArea({
  label,
  name,
  hint,
  defaultValue,
  rows = 4,
  className,
  ...rest
}: { label: string; name: string; hint?: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const err = useFieldError(name);
  const id = `f-${name}-${useId()}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        aria-invalid={err ? true : undefined}
        className={cn(ctl, "py-2")}
        {...rest}
      />
      {hint && !err && <p className="mt-1 text-xs text-bark">{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

export function FSelect({
  label,
  name,
  options,
  defaultValue,
  hint,
  className,
  ...rest
}: { label: string; name: string; options: { value: string; label: string }[]; hint?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = `f-${name}-${useId()}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold">
        {label}
      </label>
      <select id={id} name={name} defaultValue={defaultValue} className={cn(ctl, "h-10")} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-bark">{hint}</p>}
      <FieldError name={name} />
    </div>
  );
}

export function Submit({
  children = "Save",
  variant = "primary",
  className,
}: {
  children?: ReactNode;
  variant?: "primary" | "dark" | "outline" | "danger";
  className?: string;
}) {
  const styles = {
    primary: "bg-terracotta text-white hover:bg-terracotta-deep",
    dark: "bg-chocolate text-linen hover:bg-[#2a1910]",
    outline: "border border-chocolate/70 hover:bg-chocolate hover:text-linen",
    danger: "border border-danger text-danger hover:bg-danger hover:text-white",
  }[variant];
  return (
    <button
      type="submit"
      className={cn("h-10 rounded-[2px] px-5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors", styles, className)}
    >
      {children}
    </button>
  );
}
