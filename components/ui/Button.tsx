import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "sm" | "ghost" | "danger" | "sidebar";

const base =
  "inline-flex items-center gap-1.5 font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<Variant, string> = {
  primary: `${base} rounded-lg bg-blue-500 px-4 py-2 text-sm text-white shadow-sm hover:bg-blue-600 hover:shadow-md active:scale-[0.98]`,
  outline: `${base} rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-700`,
  sm: `${base} rounded-lg bg-white/20 px-3 py-1.5 text-xs text-white hover:bg-white/30`,
  ghost: `${base} rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600`,
  danger: `${base} rounded-lg px-2 py-1.5 text-sm text-slate-400 hover:bg-red-50 hover:text-red-500`,
  sidebar: `${base} rounded-md border border-white/15 bg-transparent px-2.5 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white`,
};

type ButtonProps = {
  variant?: Variant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonLinkProps = {
  variant?: Variant;
  href: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonProps) {
  const cls = [variantClasses[variant], className].filter(Boolean).join(" ");
  return <button className={cls} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className,
  ...props
}: ButtonLinkProps) {
  const cls = [variantClasses[variant], className].filter(Boolean).join(" ");
  return <a className={cls} {...props} />;
}
