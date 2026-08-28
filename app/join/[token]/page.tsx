"use client";

import { useAuth, useOrganizationList } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { acceptRoleInviteLink } from "@/features/people/actions/invite-links";

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { setActive } = useOrganizationList();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("Einladung wird geprüft …");

  useEffect(() => {
    let active = true;
    params
      .then(({ token: inviteToken }) => {
        if (active) setToken(inviteToken);
      })
      .catch(() => {
        if (active) setMessage("Der Einladungslink konnte nicht geladen werden.");
      });
    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!token || !isLoaded || !isSignedIn || !setActive) return;
    let active = true;
    acceptRoleInviteLink(token)
      .then(async (result) => {
        if (!active) return;
        if (!result.ok) {
          setMessage(
            result.error === "LINK_EXPIRED" || result.error === "LINK_ALREADY_USED"
              ? "Dieser Einladungslink ist nicht mehr gültig."
              : "Der Einladungslink konnte nicht angenommen werden.",
          );
          return;
        }
        try {
          await setActive({ organization: result.organizationId });
          router.replace("/dashboard");
        } catch {
          if (active) setMessage("Der Arbeitsbereich konnte nicht aktiviert werden.");
        }
      })
      .catch(() => {
        if (active) setMessage("Der Einladungslink konnte nicht angenommen werden.");
      });
    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, router, setActive, token]);

  if (!isLoaded || !token) {
    return <main className="flex min-h-[100dvh] items-center justify-center p-6 text-sm text-muted-foreground">Einladung wird geladen …</main>;
  }

  if (!isSignedIn) {
    return (
      <main className="soft-grid flex min-h-[100dvh] items-center justify-center overflow-y-auto p-5 text-ink sm:p-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm dark:border-white/10 dark:bg-card">
            <h1 className="text-lg font-semibold tracking-tight">Neue Einladung erforderlich</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Dieser ältere Einladungslink kann nicht mehr zur Kontoerstellung verwendet werden. Bitte lasse dir eine neue Einladung per E-Mail senden.
            </p>
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(`/join/${token}`)}`}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-ink px-4 text-sm font-semibold text-white"
            >
              Zur Anmeldung
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <main className="flex min-h-[100dvh] items-center justify-center p-6 text-sm text-muted-foreground" role="status">{message}</main>;
}
