import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./context-fab.module.css";

type ContextFabProps = {
  href: string;
  label: string;
  ariaLabel?: string;
  icon?: string;
  placement?: "primary" | "secondary" | "top";
  variant?: "default" | "report-return";
};

export function ContextFab({ href, label, ariaLabel, icon = "arrow_back", placement = "primary", variant = "default" }: ContextFabProps) {
  return (
    <Link
      aria-label={ariaLabel ?? label}
      className={[
        styles.fab,
        placement === "secondary" ? styles.secondary : "",
        placement === "top" ? styles.top : "",
        variant === "report-return" ? styles.reportReturn : "",
      ].filter(Boolean).join(" ")}
      data-tooltip={variant === "report-return" ? "BACK TO REPORT" : undefined}
      href={href}
    >
      <MaterialIcon name={icon} />
      <span>{label}</span>
    </Link>
  );
}
