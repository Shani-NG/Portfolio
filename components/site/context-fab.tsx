import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./context-fab.module.css";

type ContextFabProps = {
  href: string;
  label: string;
  icon?: string;
  placement?: "primary" | "secondary";
  variant?: "default" | "report-return";
};

export function ContextFab({ href, label, icon = "arrow_back", placement = "primary", variant = "default" }: ContextFabProps) {
  return (
    <Link
      aria-label={label}
      className={[styles.fab, placement === "secondary" ? styles.secondary : "", variant === "report-return" ? styles.reportReturn : ""].filter(Boolean).join(" ")}
      data-tooltip={variant === "report-return" ? label.toUpperCase() : undefined}
      href={href}
    >
      <MaterialIcon name={icon} />
      <span>{label}</span>
    </Link>
  );
}
