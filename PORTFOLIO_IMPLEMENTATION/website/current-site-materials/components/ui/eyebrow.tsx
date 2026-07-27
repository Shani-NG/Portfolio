import type { ElementType, ReactNode } from "react";
import styles from "./eyebrow.module.css";

type EyebrowColor = "primary" | "primaryHover" | "secondary" | "secondaryHover" | "textTertiary" | "inherit";

type EyebrowProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  color?: EyebrowColor;
  icon?: ReactNode;
};

export function Eyebrow({
  children,
  as: Component = "p",
  className,
  color = "primary",
  icon,
}: EyebrowProps) {
  const classes = [
    styles.eyebrow,
    styles[color],
    icon ? styles.withIcon : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Component className={classes}>
      {icon ? <span className={styles.icon}>{icon}</span> : null}
      <span>{children}</span>
    </Component>
  );
}
