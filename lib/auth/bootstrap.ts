import "server-only";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function mapOrganizationRole(role: string | null | undefined, metadata?: unknown) {
  if (metadata && typeof metadata === "object") {
    const appRole = (metadata as { abiVaultRole?: unknown }).abiVaultRole;
    if (appRole === "admin" || appRole === "supervisor" || appRole === "student") {
      return appRole;
    }
  }
  if (role === "org:admin" || role === "admin") return "admin" as const;
  if (role === "org:supervisor" || role === "supervisor") return "supervisor" as const;
  return "student" as const;
}

const BOOTSTRAP_CACHE_TTL_MS = 60_000;
const completedScopes = new Map<string, number>();
const inFlightScopes = new Map<string, Promise<void>>();

async function bootstrapOrganizationData(session: Awaited<ReturnType<typeof auth>>) {
  if (!session.userId || !session.orgId) return;

  const admin = createSupabaseAdminClient();
  const user = await currentUser();
  const clerk = await clerkClient();
  const organization = await clerk.organizations.getOrganization({ organizationId: session.orgId });
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.primaryEmailAddress?.emailAddress || "Clerk-Nutzer";

  const { error: committeeError } = await admin.from("committees").upsert({
    organization_id: session.orgId,
    name: organization.name,
  }, { onConflict: "organization_id" });
  if (committeeError) throw committeeError;

  const { data: existingProfile, error: profileLookupError } = await admin
    .from("profiles")
    .select("clerk_user_id")
    .eq("clerk_user_id", session.userId)
    .maybeSingle();
  if (profileLookupError) throw profileLookupError;
  if (existingProfile) {
    const { error: profileUpdateError } = await admin
      .from("profiles")
      .update({
        display_name: displayName,
        email: user?.primaryEmailAddress?.emailAddress ?? "",
      })
      .eq("clerk_user_id", session.userId);
    if (profileUpdateError) throw profileUpdateError;
  } else {
    const { error: profileInsertError } = await admin.from("profiles").insert({
      clerk_user_id: session.userId,
      display_name: displayName,
      email: user?.primaryEmailAddress?.emailAddress ?? "",
      status: "active",
    });
    if (profileInsertError) throw profileInsertError;
  }

  const { data: existingMembership, error: membershipLookupError } = await admin
    .from("committee_memberships")
    .select("role, status")
    .eq("organization_id", session.orgId)
    .eq("clerk_user_id", session.userId)
    .maybeSingle();
  if (membershipLookupError) throw membershipLookupError;
  if (existingMembership?.status === "removed") return;
  let initialRole = existingMembership?.role;
  if (!initialRole) {
    const memberships = await clerk.organizations.getOrganizationMembershipList({
      organizationId: session.orgId,
      userId: [session.userId],
      limit: 1,
    });
    initialRole = mapOrganizationRole(
      session.orgRole,
      memberships.data[0]?.publicMetadata,
    );
  }
  const { error: membershipError } = await admin.from("committee_memberships").upsert({
    organization_id: session.orgId,
    clerk_user_id: session.userId,
    role: initialRole,
    clerk_role: session.orgRole ?? null,
    status: "active",
  }, { onConflict: "organization_id,clerk_user_id" });
  if (membershipError) throw membershipError;

  const { error: settingsError } = await admin.from("committee_settings").upsert({
    organization_id: session.orgId,
    school_name: "",
    graduation_year: new Date().getFullYear(),
    currency: "USD",
    timezone: "Europe/Berlin",
  }, { onConflict: "organization_id", ignoreDuplicates: true });
  if (settingsError) throw settingsError;

  const year = new Date().getFullYear();
  const { error: periodsError } = await admin.from("accounting_periods").upsert(
    Array.from({ length: 12 }, (_, index) => ({ organization_id: session.orgId!, year, month: index + 1 })),
    { onConflict: "organization_id,year,month", ignoreDuplicates: true },
  );
  if (periodsError) throw periodsError;
  const defaults = [
    ["Veranstaltung", "expense", 10],
    ["Material", "expense", 20],
    ["Sonstiges", "expense", 30],
    ["Spenden", "income", 40],
    ["Sales", "income", 50],
  ] as const;
  const { error: categoriesError } = await admin.from("categories").upsert(
    defaults.map(([name, kind, display_order]) => ({ organization_id: session.orgId!, name, kind, display_order })),
    { onConflict: "organization_id,name,kind", ignoreDuplicates: true },
  );
  if (categoriesError) throw categoriesError;
}

export async function ensureCurrentOrganizationData() {
  const session = await auth();
  if (!session.userId || !session.orgId) return;

  const scope = `${session.orgId}:${session.userId}`;
  const completedAt = completedScopes.get(scope);
  if (completedAt && Date.now() - completedAt < BOOTSTRAP_CACHE_TTL_MS) return;

  const running = inFlightScopes.get(scope);
  if (running) return running;

  const bootstrap = bootstrapOrganizationData(session)
    .then(() => {
      completedScopes.set(scope, Date.now());
    })
    .finally(() => {
      inFlightScopes.delete(scope);
    });
  inFlightScopes.set(scope, bootstrap);
  return bootstrap;
}
