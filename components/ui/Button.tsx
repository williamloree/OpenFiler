import { type ButtonHTMLAttributes, type AnchorHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "sm" | "ghost" | "danger" | "sidebar";

const variantClasses: Record<Variant, string> = {
  primary: "fb-btn fb-btn-primary",
  outline: "fb-btn fb-btn-outline",
  sm: "fb-btn fb-btn-sm",
  ghost: "fb-action-btn",
  danger: "fb-action-btn delete",
  sidebar: "fb-signout-btn",
};

type ButtonProps = {
  variant?: Variant;
} & ButtonHTMLAttributes<HTMLButtonElement>;

type ButtonLinkProps = {
  variant?: Variant;
  href: string;
} & AnchorHTMLAttributes<HTMLAnchorElement>;

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  const cls = [variantClasses[variant], className].filter(Boolean).join(" ");
  return <button className={cls} {...props} />;
}

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  const cls = [variantClasses[variant], className].filter(Boolean).join(" ");
  return <a className={cls} {...props} />;
}
