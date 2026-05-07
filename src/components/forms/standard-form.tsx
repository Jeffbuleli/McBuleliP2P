import type { ReactNode } from "react";

export function FormPageShell(props: { children: ReactNode }) {
  return <div className="mx-auto max-w-lg space-y-5 pb-10 pt-2">{props.children}</div>;
}

export function FormCard(props: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-4 dark:border-stone-700 dark:bg-stone-900/60">
      <div className="grid gap-3">{props.children}</div>
    </div>
  );
}

export function FieldLabel(props: { label: ReactNode; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-stone-800 dark:text-stone-200">
      <span>{props.label}</span>
      {props.children}
    </label>
  );
}

export const inputClass =
  "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100";

export const inputMonoClass =
  "mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-3 font-mono text-sm dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100";

export const primaryBtnClass =
  "w-full rounded-2xl bg-emerald-700 py-3.5 text-lg font-semibold text-white disabled:opacity-40";

export function ErrorBanner(props: { children: ReactNode }) {
  return (
    <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-900 dark:bg-rose-950/40 dark:text-rose-100">
      {props.children}
    </p>
  );
}

export function HelperText(props: { children: ReactNode }) {
  return <p className="text-xs text-stone-500 dark:text-stone-400">{props.children}</p>;
}

