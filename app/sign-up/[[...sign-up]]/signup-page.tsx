import { SignUp } from "@clerk/nextjs";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="soft-grid flex min-h-[100dvh] flex-col text-ink">
      <header className="px-6 py-6 sm:px-10 sm:py-8">
        <div className="flex items-center">
          <Link
            href="/"
            className="flex items-center gap-2.5"
            aria-label="Abi Manager home"
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
          <SignUp
            appearance={{
              variables: {
                colorPrimary: "#1d1d1f",
                colorBackground: "#ffffff",
                colorForeground: "#1d1d1f",
                colorMutedForeground: "#6b6b70",
                colorInput: "#ffffff",
                colorInputForeground: "#1d1d1f",
                borderRadius: "12px",
                fontFamily: "var(--font-geist-sans)",
              },
              elements: {
                rootBox: "w-full",
                cardBox: "w-full shadow-none",
                card: "w-full rounded-2xl border border-black/[0.08] bg-white p-2 shadow-[0_16px_50px_rgb(0_0_0/0.08)]",
                header: "hidden",
                formButtonPrimary:
                  "rounded-xl bg-ink shadow-sm hover:bg-black",
                formFieldInput:
                  "rounded-xl border-line bg-white shadow-none focus:border-ink",
                socialButtonsBlockButton:
                  "rounded-xl border-line bg-white shadow-none hover:bg-canvas",
                footer: "rounded-b-2xl bg-transparent",
                footerActionLink:
                  "text-ink underline decoration-line underline-offset-4",
              },
            }}
          />
        </div>
      </section>
    </main>
  );
}
