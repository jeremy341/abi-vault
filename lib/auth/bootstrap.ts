import "server-only";

import { auth, clerkClient, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function mapOrganizationRole(role: string | null | undefined) {
  if (role === "org:admin" || role === "admin") return "admin" as const;
  if (role === "org:supervisor" || role === "supervisor") return "supervisor" as const;
  return "supervisor" as const;
}

export async function ensureCurrentOrganizationData() {
  const session = await auth();
  if (!session.userId || !session.orgId) return;

  const admin = createSupabaseAdminClient();
  const user = await currentUser();
  const organization = await (await clerkClient()).organizations.getOrganization({ organizationId: session.orgId });
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.primaryEmailAddress?.emailAddress || "Clerk user";

  await admin.from("committees").upsert({
    organization_id: session.orgId,
    name: organization.name,
  }, { onConflict: "organization_id" });
  await admin.from("profiles").upsert({
    clerk_user_id: session.userId,
    display_name: displayName,
    email: user?.primaryEmailAddress?.emailAddress ?? "",
    status: "active",
  }, { onConflict: "clerk_user_id" });

  const { data: existingMembership } = await admin
    .from("committee_memberships")
    .select("role")
    .eq("organization_id", session.orgId)
    .eq("clerk_user_id", session.userId)
    .maybeSingle();
  await admin.from("committee_memberships").upsert({
    organization_id: session.orgId,
    clerk_user_id: session.userId,
    role: existingMembership?.role ?? mapOrganizationRole(session.orgRole),
    clerk_role: session.orgRole ?? null,
    status: "active",
  }, { onConflict: "organization_id,clerk_user_id" });

  await admin.from("committee_settings").upsert({
    organization_id: session.orgId,
    school_name: "",
    graduation_year: new Date().getFullYear(),
    currency: "EUR",
    timezone: "Europe/Berlin",
  }, { onConflict: "organization_id", ignoreDuplicates: true });

  const year = new Date().getFullYear();
  await admin.from("accounting_periods").upsert(
    Array.from({ length: 12 }, (_, index) => ({ organization_id: session.orgId!, year, month: index + 1 })),
    { onConflict: "organization_id,year,month", ignoreDuplicates: true },
  );
  const defaults = [
    ["Veranstaltung", "expense", 10],
    ["Material", "expense", 20],
    ["Sonstiges", "expense", 30],
    ["Spenden", "income", 40],
    ["Verkäufe", "income", 50],
  ] as const;
  await admin.from("categories").upsert(
    defaults.map(([name, kind, display_order]) => ({ organization_id: session.orgId!, name, kind, display_order })),
    { onConflict: "organization_id,name,kind", ignoreDuplicates: true },
  );
}
