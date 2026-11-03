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
  const [message, setMessage] = useState("Checking invitation …");

  useEffect(() => {
    let active = true;
    params
      .then(({ token: inviteToken }) => {
        if (active) setToken(inviteToken);
      })
      .catch(() => {
        if (active) setMessage("The invitation link could not be loaded.");
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
            result.error.code === "LINK_EXPIRED" || result.error.code === "LINK_ALREADY_USED"
              ? "This invitation link is no longer valid."
              : "The invitation link could not be accepted.",
          );

          return;
        }

        try {
          await setActive({ organization: result.data.organizationId });
          router.replace("/dashboard");
        } catch {
          if (active) setMessage("The workspace could not be activated.");
        }
      })
      .catch(() => {
        if (active) setMessage("The invitation link could not be accepted.");
      });

    return () => {
      active = false;
    };
  }, [isLoaded, isSignedIn, router, setActive, token]);

  if (!isLoaded || !token) {
    return <main className="flex min-h-[100dvh] items-center justify-center p-6 text-sm text-muted-foreground">Loading invitation …</main>;
  }

  if (!isSignedIn) {
    return (
      <main className="soft-grid flex min-h-[100dvh] items-center justify-center overflow-y-auto p-5 text-ink sm:p-8">
        <div className="w-full max-w-md">
          <div className="rounded-[var(--ui-card-radius)] border border-[var(--ui-border)] bg-[var(--ui-surface)] p-6 text-center shadow-[var(--ui-card-shadow)]">
            <h1 className="text-lg font-semibold tracking-tight">New invitation required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This older invitation link can no longer be used to create an account. Please request a new invitation by email.
            </p>
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(`/join/${token}`)}`}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-[var(--ui-control-radius)] bg-[var(--ui-action-primary)] px-4 text-sm font-semibold text-[var(--ui-action-primary-ink)]"
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
