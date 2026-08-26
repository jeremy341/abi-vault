"use client";

import { SignUp, useAuth, useOrganizationList } from "@clerk/nextjs";
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
    params.then(({ token: inviteToken }) => {
      if (active) setToken(inviteToken);
    });
    return () => {
      active = false;
    };
  }, [params]);

  useEffect(() => {
    if (!token || !isLoaded || !isSignedIn || !setActive) return;
    let active = true;
    acceptRoleInviteLink(token).then(async (result) => {
      if (!active) return;
      if (!result.ok) {
        setMessage(
          result.error === "LINK_EXPIRED" || result.error === "LINK_ALREADY_USED"
            ? "Dieser Einladungslink ist nicht mehr gültig."
            : "Der Einladungslink konnte nicht angenommen werden.",
        );
        return;
      }
      await setActive({ organization: result.organizationId });
      router.replace("/dashboard");
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
          <SignUp
            fallbackRedirectUrl={`/join/${token}`}
            signInUrl={`/sign-in?redirect_url=${encodeURIComponent(`/join/${token}`)}`}
          />
        </div>
      </main>
    );
  }

  return <main className="flex min-h-[100dvh] items-center justify-center p-6 text-sm text-muted-foreground" role="status">{message}</main>;
}
