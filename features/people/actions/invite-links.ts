"use server";

import { createHash, randomBytes } from "node:crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/permissions-server";
import {
  inviteLinkRoleSchema,
  type InviteLinkRoleInput,
} from "@/features/people/schemas/invite-links";
import { actionFailure, actionSuccess, type ActionResult } from "@/lib/api/result";

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

export async function createRoleInviteLink(input: InviteLinkRoleInput): Promise<ActionResult<{ id: string; role: "admin" | "supervisor"; expiresAt: string; url: string }>> {
  const parsed = inviteLinkRoleSchema.safeParse(input);
  if (!parsed.success) return actionFailure("INVALID_INPUT", "The invitation link data is invalid.");

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

  if (error || !data) return actionFailure("LINK_CREATE_FAILED", "The invitation link could not be created.");

  return actionSuccess({
    id: data.id,
    role: parsed.data.role,
    expiresAt: expiresAt.toISOString(),
    url: `${await appOrigin()}/join/${token}`,
  });
}

export async function acceptRoleInviteLink(token: string): Promise<ActionResult<{ organizationId: string; role: "admin" | "supervisor" }>> {
  const session = await auth();
  if (!session.userId) return actionFailure("UNAUTHENTICATED", "Sign-in is required.");
  if (!token || token.length < 32) return actionFailure("INVALID_LINK", "The invitation link is invalid.");

  const admin = createSupabaseAdminClient();
  const tokenHash = hashToken(token);
  const { data: invite, error: lookupError } = await admin
    .from("organization_invite_links")
    .select("id, organization_id, role, max_uses, uses, expires_at, revoked_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();

  if (lookupError || !invite) return actionFailure("INVALID_LINK", "The invitation link is invalid.");
  if (invite.revoked_at || invite.uses >= invite.max_uses || new Date(invite.expires_at).getTime() <= Date.now()) {
    return actionFailure("LINK_EXPIRED", "The invitation link is no longer valid.");
  }

  const clerkRole = invite.role === "admin" ? "org:admin" : "org:member";

  const { data: existingMembership, error: existingMembershipError } = await admin
    .from("committee_memberships")
    .select("role, clerk_role")
    .eq("organization_id", invite.organization_id)
    .eq("clerk_user_id", session.userId)
    .eq("status", "active")
    .maybeSingle();
  if (existingMembershipError) return actionFailure("MEMBERSHIP_SYNC_FAILED", "The membership could not be synchronized.");

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
    return actionFailure("MEMBERSHIP_CREATE_FAILED", "The membership could not be created.");
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
    return actionFailure("LINK_ALREADY_USED", "The invitation link has already been used.");
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
    return actionFailure("MEMBERSHIP_SYNC_FAILED", "The membership could not be synchronized.");
  }
  return actionSuccess({ organizationId: invite.organization_id, role: applicationRole });
}
