"use client";

import { useAuth, useOrganizationList } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AbiLogo from "@/components/AbiLogo";
import { acceptRoleInviteLink } from "@/features/people/actions/invite-links";
import styles from "@/app/welcome-page.module.css";

export default function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const { setActive } = useOrganizationList();
  const [token, setToken] = useState("");
  const [message, setMessage] = useState("Checking invitation");

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
      .then(async (acceptance) => {
        if (!active) return;

        if (!acceptance.ok) {
          setMessage(
            acceptance.error.code === "LINK_EXPIRED" || acceptance.error.code === "LINK_ALREADY_USED"
              ? "This invitation link is no longer valid."
              : "The invitation link could not be accepted.",
          );

          return;
        }

        try {
          await setActive({ organization: acceptance.data.organizationId });
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
    return <main className={styles.page} ><header className={styles.header}><AbiLogo /></header><section className={styles.panel}><p>Loading invitation</p></section></main>;
  }

  if (!isSignedIn) {
    return (
      <main className={styles.page}>
        <header className={styles.header}>
          <AbiLogo />
        </header>
        <section className={styles.panel}>
          <h1>New invitation required</h1>
          <p>This invitation link is out of date and can no longer create an account. Ask for a new invitation by email.</p>
          <div className={styles.actions}>
            <Link href={`/sign-in?redirect_url=${encodeURIComponent(`/join/${token}`)}`} className={styles.button}>
              Sign in
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page} >
      <header className={styles.header}>
        <AbiLogo />
      </header>
      <section className={styles.panel}>
        <p>{message}</p>
      </section>
    </main>
  );
}
