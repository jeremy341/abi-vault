import dlg from "./dialog.module.css";
import styles from "./AccountCardModal.module.css";

export const cardColors = [
  { name: "Charcoal", value: "#242426" },
  { name: "Graphite", value: "#3b3b40" },
  { name: "White", value: "#e9e9e7" },
  { name: "Forest", value: "#25453b" },
  { name: "Burgundy", value: "#542f38" },
  { name: "Navy", value: "#26364d" },
  { name: "Sand", value: "#9a8d78" },
  { name: "Terracotta", value: "#8b5142" },
];

export function CardColorPicker({
  idPrefix,
  selectedColor,
  onSelect,
}: {
  idPrefix: string;
  selectedColor: string;
  onSelect: (color: string) => void;
}) {
  const titleId = `${idPrefix}-colors`;

  return (
    <section className={dlg.section} aria-labelledby={titleId}>
      <h3 id={titleId} className={dlg.sectionTitle}>
        Color
      </h3>
      <div className={styles.colorOptions}>
        {cardColors.map((color) => (
          <button
            key={color.value}
            type="button"
            className={styles.colorOption}
            aria-label={color.name}
            aria-pressed={selectedColor === color.value}
            style={{ "--swatch": color.value } as React.CSSProperties}
            onClick={() => onSelect(color.value)}
          />
        ))}
      </div>
    </section>
  );
}
