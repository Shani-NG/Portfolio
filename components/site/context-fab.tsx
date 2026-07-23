import Link from "next/link";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./context-fab.module.css";

type ContextFabProps = {
  href: string;
  label: string;
  icon?: string;
};

export function ContextFab({ href, label, icon = "arrow_back" }: ContextFabProps) {
  return (
    <Link aria-label={label} className={styles.fab} href={href}>
      <MaterialIcon name={icon} />
      <span>{label}</span>
    </Link>
  );
}
