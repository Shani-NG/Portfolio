import styles from "./material-icon.module.css";

type MaterialIconProps = {
  name: string;
  className?: string;
};

export function MaterialIcon({ name, className }: MaterialIconProps) {
  return (
    <span aria-hidden="true" className={`${styles.icon} ${className ?? ""}`}>
      {name}
    </span>
  );
}
