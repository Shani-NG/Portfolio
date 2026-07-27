import type { HTMLAttributes, ReactNode } from "react";
import styles from "./system-card.module.css";

type SystemCardProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  interaction?: "static" | "lift";
};

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function SystemCard({ children, className, interaction = "static", ...props }: SystemCardProps) {
  return (
    <article className={joinClasses(styles.card, interaction === "lift" ? styles.interactive : undefined, className)} {...props}>
      {children}
    </article>
  );
}

SystemCard.Header = function SystemCardHeader({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={joinClasses(styles.header, className)} {...props}>
      {children}
    </div>
  );
};

SystemCard.Icon = function SystemCardIcon({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={joinClasses(styles.icon, className)} aria-hidden="true" {...props}>
      {children}
    </div>
  );
};

SystemCard.Eyebrow = function SystemCardEyebrow({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={joinClasses(styles.eyebrow, className)} {...props}>
      {children}
    </p>
  );
};

SystemCard.Title = function SystemCardTitle({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={joinClasses(styles.title, className)} {...props}>
      {children}
    </h3>
  );
};

SystemCard.Body = function SystemCardBody({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={joinClasses(styles.body, className)} {...props}>
      {children}
    </p>
  );
};

SystemCard.Actions = function SystemCardActions({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={joinClasses(styles.actions, className)} {...props}>
      {children}
    </div>
  );
};
