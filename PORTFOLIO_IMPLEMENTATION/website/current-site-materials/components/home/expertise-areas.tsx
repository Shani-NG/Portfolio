import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./expertise-areas.module.css";

type ExpertiseArea = {
  icon: string;
  title: string;
  items: readonly string[];
};

type ExpertiseAreasProps = {
  areas: readonly ExpertiseArea[];
};

export function ExpertiseAreas({ areas }: ExpertiseAreasProps) {
  return (
    <div className={styles.grid}>
      {areas.map((area) => (
        <article className={styles.area} key={area.title}>
          <div className={styles.header}>
            <span className={styles.icon} aria-hidden="true"><MaterialIcon name={area.icon} /></span>
            <h3 className={styles.title}>{area.title}</h3>
          </div>
          <ul className={styles.list}>
            {area.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
