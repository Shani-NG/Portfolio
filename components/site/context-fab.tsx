import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./context-fab.module.css";

type ContextFabProps = {
  href: string;
  label: string;
  icon?: string;
  placement?: "primary" | "secondary";
};

export function ContextFab({ href, label, icon = "arrow_back", placement = "primary" }: ContextFabProps) {
  return (
    <Link aria-label={label} className={[styles.fab, placement === "secondary" ? styles.secondary : ""].filter(Boolean).join(" ")} href={href}>
      <MaterialIcon name={icon} />
      <span>{label}</span>
    </Link>
  );
}
