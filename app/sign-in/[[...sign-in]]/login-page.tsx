import { SignIn } from "@clerk/nextjs";
import Link from "next/link";

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
    <main className="soft-grid flex min-h-[100dvh] flex-col overflow-y-auto text-ink">
      <header className="px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Abi Manager Startseite"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-sm font-semibold text-white">
              A
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Abi Manager
            </span>
          </Link>
        </div>
      </header>

      <section className="flex flex-1 items-center justify-center px-5 pb-24 pt-8 sm:px-8">
        <div className="w-full max-w-md">
          <SignIn fallbackRedirectUrl={redirectUrl} />
        </div>
      </section>
    </main>
  );
}
