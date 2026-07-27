import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./chip.module.css";

type ChipKind = "info" | "action" | "link";
type ChipTone = "neutral" | "primary" | "secondary" | "success" | "warning";

type ChipProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  href?: string;
  icon?: string;
  kind?: ChipKind;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
  selected?: boolean;
  title?: string;
  tone?: ChipTone;
  type?: ButtonHTMLAttributes<HTMLButtonElement>["type"];
};

function joinClasses(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function getTitle(children: ReactNode, title?: string) {
  return title ?? (typeof children === "string" ? children : undefined);
}

export function Chip({
  children,
  className,
  disabled = false,
  href,
  icon,
  kind = href ? "link" : "info",
  onClick,
  selected = false,
  title,
  tone = "neutral",
  type = "button",
  ...props
}: ChipProps) {
  const classes = joinClasses(
    styles.chip,
    styles[kind],
    styles[tone],
    selected && styles.selected,
    disabled && styles.disabled,
    className,
  );
  const content = (
    <>
      {icon ? <MaterialIcon className={styles.icon} name={icon} /> : null}
      <span className={styles.label}>{children}</span>
    </>
  );
  const resolvedTitle = getTitle(children, title);

  if (href) {
    const anchorProps = props as AnchorHTMLAttributes<HTMLAnchorElement>;

    return (
      <Link aria-disabled={disabled || undefined} className={classes} href={disabled ? "#" : href} title={resolvedTitle} {...anchorProps}>
        {content}
      </Link>
    );
  }

  if (kind === "action" || onClick) {
    const buttonProps = props as ButtonHTMLAttributes<HTMLButtonElement>;

    return (
      <button className={classes} disabled={disabled} onClick={onClick} title={resolvedTitle} type={type} {...buttonProps}>
        {content}
      </button>
    );
  }

  return (
    <span className={classes} title={resolvedTitle} {...(props as HTMLAttributes<HTMLSpanElement>)}>
      {content}
    </span>
  );
}
