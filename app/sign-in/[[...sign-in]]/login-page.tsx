import { SignIn } from "@clerk/nextjs";
import AbiLogo from "@/components/AbiLogo";
import styles from "@/app/welcome-page.module.css";

export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;

  const redirectUrl = params?.redirect_url?.startsWith("/")
    ? params.redirect_url
    : "/dashboard";

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <AbiLogo />
      </header>
      <section className={styles.clerk}>
        <div>
          <h1 className={styles.clerkTitle}>Sign in to Abi Vault</h1>
          <SignIn fallbackRedirectUrl={redirectUrl} />
        </div>
      </section>
    </main>
  );
}
