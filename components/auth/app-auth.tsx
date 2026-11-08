"use client";

import { useAuth as useClerkAuth } from "@clerk/nextjs";
import { createContext, useContext, type ReactNode } from "react";
import { LOCAL_ORGANIZATION_ID, LOCAL_USER_ID } from "@/lib/auth/constants";

type AppAuth = {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  orgId: string | null;
  orgRole: string | null;
};

const localAuth: AppAuth = {
  isLoaded: true,
  isSignedIn: true,
  userId: LOCAL_USER_ID,
  orgId: LOCAL_ORGANIZATION_ID,
  orgRole: "org:admin",
};

const AppAuthContext = createContext<AppAuth | null>(null);

export function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const auth = useClerkAuth();

  return (
    <AppAuthContext.Provider
      value={{
        isLoaded: auth.isLoaded,
        isSignedIn: auth.isSignedIn ?? false,
        userId: auth.userId ?? null,
        orgId: auth.orgId ?? null,
        orgRole: auth.orgRole ?? null,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}

export type LocalSession = { userId: string; organizationId: string; orgRole: string };

export function LocalAuthProvider({ children, session }: { children: ReactNode; session?: LocalSession }) {
  const value: AppAuth = session
    ? { isLoaded: true, isSignedIn: true, userId: session.userId, orgId: session.organizationId, orgRole: session.orgRole }
    : localAuth;
  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function useAppAuth() {
  const auth = useContext(AppAuthContext);

  if (!auth) throw new Error("useAppAuth must be used inside the app auth provider");

  return auth;
}
