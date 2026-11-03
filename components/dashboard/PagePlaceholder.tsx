import styles from "@/app/dashboard/dashboard.module.css";

type PagePlaceholderProps = {
  title: string;
  description: string;
};

export default function PagePlaceholder({
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <section
      className={styles.placeholderPage}
      aria-labelledby="page-placeholder-title"
    >
      <div className={styles.emptyState}>
        <span>Class of 2026</span>
        <h2 id="page-placeholder-title">{title}</h2>
        <p>{description}</p>
      </div>
    </section>
  );
}
