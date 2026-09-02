"use server";

import { createHash, randomBytes } from "node:crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions-server";
import { inviteLinkRoleSchema } from "@/features/people/schemas/invite-links";

const ROLE_LIMITS = {
  supervisor: { days: 30, uses: 30 },
  admin: { days: 7, uses: 1 },
} as const;

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function appOrigin() {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  return host ? `${protocol}://${host}` : "http://localhost:3000";
}

export async function createRoleInviteLink(input: unknown) {
  const parsed = inviteLinkRoleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "INVALID_INPUT" };

  const context = await requirePermission("manageMemberships");
  const admin = createSupabaseAdminClient();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const limits = ROLE_LIMITS[parsed.data.role];
  const expiresAt = new Date(Date.now() + limits.days * 24 * 60 * 60 * 1000);

  const { data, error } = await admin
    .from("organization_invite_links")
    .insert({
      organization_id: context.organizationId,
      token_hash: tokenHash,
      role: parsed.data.role,
      created_by: context.clerkUserId,
      max_uses: limits.uses,
      expires_at: expiresAt.toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false as const, error: "LINK_CREATE_FAILED" };

  return {
    ok: true as const,
    id: data.id,
    role: parsed.data.role,
    expiresAt: expiresAt.toISOString(),
    url: `${await appOrigin()}/join/${token}`,
  };
}

export async function revokeRoleInviteLink(input: unknown) {
  if (typeof input !== "string" || !/^[0-9a-f-]{36}$/i.test(input)) {
    return { ok: false as const, error: "INVALID_INPUT" };
  }

  const context = await requirePermission("manageMemberships");
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("organization_invite_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", input)
    .eq("organization_id", context.organizationId)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  return error || !data
    ? { ok: false as const, error: "REVOKE_FAILED" }
    : { ok: true as const };
}

export async function acceptRoleInviteLink(token: string) {
  const session = await auth();
  if (!session.userId) return { ok: false as const, error: "UNAUTHENTICATED" };
  if (!token || token.length < 32) return { ok: false as const, error: "INVALID_LINK" };

  const admin = createSupabaseAdminClient();
  const tokenHash = hashToken(token);
  const { data: invite, error: lookupError } = await admin
    .from("organization_invite_links")
    .select("id, organization_id, role, max_uses, uses, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (lookupError || !invite) return { ok: false as const, error: "INVALID_LINK" };
  if (invite.revoked_at || invite.uses >= invite.max_uses || new Date(invite.expires_at).getTime() <= Date.now()) {
    return { ok: false as const, error: "LINK_EXPIRED" };
  }

  const clerkRole = invite.role === "admin" ? "org:admin" : "org:member";

  const { data: existingMembership, error: existingMembershipError } = await admin
    .from("committee_memberships")
    .select("role, clerk_role")
    .eq("organization_id", invite.organization_id)
    .eq("clerk_user_id", session.userId)
    .eq("status", "active")
    .maybeSingle();
  if (existingMembershipError) return { ok: false as const, error: "MEMBERSHIP_SYNC_FAILED" };

  const client = await clerkClient();
  let createdClerkMembership = false;
  try {
    if (!existingMembership) {
      await client.organizations.createOrganizationMembership({
        organizationId: invite.organization_id,
        userId: session.userId,
        role: clerkRole,
      });
      createdClerkMembership = true;
    }
  } catch {
    return { ok: false as const, error: "MEMBERSHIP_CREATE_FAILED" };
  }

  const { data: consumed, error: consumeError } = await admin
    .from("organization_invite_links")
    .update({ uses: invite.uses + 1 })
    .eq("id", invite.id)
    .eq("uses", invite.uses)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();

  if (consumeError || !consumed) {
    if (createdClerkMembership) {
      try {
        await client.organizations.deleteOrganizationMembership({
          organizationId: invite.organization_id,
          userId: session.userId,
        });
      } catch {
        // The failed link claim must not block the response. The membership
        // webhook remains the final reconciliation path if cleanup fails.
      }
    }
    return { ok: false as const, error: "LINK_ALREADY_USED" };
  }

  const applicationRole = existingMembership?.role === "admin"
    ? "admin"
    : invite.role === "admin"
      ? "admin"
      : "supervisor";
  const applicationClerkRole = applicationRole === "admin" ? "org:admin" : "org:member";

  const { error: membershipError } = await admin
    .from("committee_memberships")
    .upsert({
      organization_id: invite.organization_id,
      clerk_user_id: session.userId,
      role: applicationRole,
      clerk_role: applicationClerkRole,
      status: "active",
    }, { onConflict: "organization_id,clerk_user_id" });

  if (membershipError) {
    await admin
      .from("organization_invite_links")
      .update({ uses: invite.uses })
      .eq("id", invite.id)
      .eq("uses", invite.uses + 1);
    if (createdClerkMembership) {
      try {
        await client.organizations.deleteOrganizationMembership({
          organizationId: invite.organization_id,
          userId: session.userId,
        });
      } catch {
        // The membership webhook remains the final reconciliation path.
      }
    }
    return { ok: false as const, error: "MEMBERSHIP_SYNC_FAILED" };
  }
  return { ok: true as const, organizationId: invite.organization_id, role: applicationRole };
}
