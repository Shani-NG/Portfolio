"use client";

import { useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import styles from "./kms-process-gallery.module.css";

type GalleryItem = {
  src: string;
  alt: string;
};

export function KmsProcessGallery({ items }: { items: readonly GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState(1);
  const orderedItems = useMemo(() => {
    const total = items.length;
    return [-1, 0, 1].map((offset) => {
      const index = (activeIndex + offset + total) % total;
      return { ...items[index], index, isActive: offset === 0 };
    });
  }, [activeIndex, items]);

  function moveActiveIndex(offset: number) {
    setActiveIndex((currentIndex) => (currentIndex + offset + items.length) % items.length);
  }

  return (
    <div className={styles.galleryShell} aria-label="Process model image gallery" aria-roledescription="carousel">
      <button className={styles.control} type="button" aria-label="Show previous process image" onClick={() => moveActiveIndex(-1)}>
        <MaterialIcon name="chevron_left" />
      </button>
      <div className={styles.gallery}>
        {orderedItems.map((item) => (
          <button
            aria-current={item.isActive ? "true" : undefined}
            aria-label={item.isActive ? `${item.alt}, selected` : `Show ${item.alt}`}
            className={item.isActive ? styles.active : styles.item}
            key={item.index}
            onClick={() => setActiveIndex(item.index)}
            type="button"
          >
            <img alt={item.alt} src={item.src} />
          </button>
        ))}
      </div>
      <button className={styles.control} type="button" aria-label="Show next process image" onClick={() => moveActiveIndex(1)}>
        <MaterialIcon name="chevron_right" />
      </button>
    </div>
  );
}
