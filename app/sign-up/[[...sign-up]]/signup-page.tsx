import { SignUp } from "@clerk/nextjs";
import AbiLogo from "@/components/AbiLogo";
import styles from "@/app/welcome-page.module.css";

export default function SignUpPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <AbiLogo />
      </header>
      <section className={styles.clerk}>
        <div>
          <h1 className={styles.clerkTitle}>Create your account</h1>
          <SignUp fallbackRedirectUrl="/dashboard" />
        </div>
      </section>
    </main>
  );
}
