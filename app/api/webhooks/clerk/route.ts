import { verifyWebhook } from "@clerk/nextjs/webhooks";
import type { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

function displayName(data: {
  first_name?: string | null;
  last_name?: string | null;
}) {
  return [data.first_name, data.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();
}

function primaryEmail(data: {
  email_addresses?: Array<{ email_address: string }>;
}) {
  return data.email_addresses?.[0]?.email_address ?? "";
}

function applicationRoleFromClerkRole(role: string | null | undefined) {
  if (role === "org:admin" || role === "admin") return "admin" as const;
  if (role === "org:supervisor" || role === "supervisor") return "supervisor" as const;
  return "supervisor" as const;
}

async function recordWebhook(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  eventType: string,
) {
  const { data: existing, error: lookupError } = await admin
    .from("webhook_logs")
    .select("status")
    .eq("provider", "clerk")
    .eq("event_id", eventId)
    .maybeSingle();

  if (lookupError) throw lookupError;
  if (existing?.status === "processed") return false;

  if (!existing) {
    const { error } = await admin.from("webhook_logs").insert({
      provider: "clerk",
      event_id: eventId,
      event_type: eventType,
      status: "received",
    });
    if (error && error.code !== "23505") throw error;
  }

  return true;
}

async function markWebhook(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  eventId: string,
  status: "processed" | "failed",
  errorMessage?: string,
) {
  await admin
    .from("webhook_logs")
    .update({
      status,
      processed_at: status === "processed" ? new Date().toISOString() : null,
      error_code: status === "failed" ? "PROCESSING_FAILED" : null,
      error_message: errorMessage?.slice(0, 500) ?? null,
    })
    .eq("provider", "clerk")
    .eq("event_id", eventId);
}

export async function POST(request: NextRequest) {
  const eventId = request.headers.get("svix-id");
  if (!eventId) return new Response("Missing webhook event id", { status: 400 });

  let event;
  try {
    event = await verifyWebhook(request);
  } catch {
    return new Response("Webhook verification failed", { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  let shouldProcess = true;

  try {
    shouldProcess = await recordWebhook(admin, eventId, event.type);
    if (!shouldProcess) return new Response("Already processed", { status: 200 });

    if (event.type === "user.created" || event.type === "user.updated") {
      const user = event.data;
      const { error } = await admin.from("profiles").upsert(
        {
          clerk_user_id: user.id,
          display_name: displayName(user),
          email: primaryEmail(user),
          status: "active",
        },
        { onConflict: "clerk_user_id" },
      );
      if (error) throw error;
    }

    if (event.type === "user.deleted") {
      const { error } = await admin
        .from("profiles")
        .update({
          status: "deleted",
          display_name: "Deleted user",
          email: "",
        })
        .eq("clerk_user_id", event.data.id);
      if (error) throw error;

      const { error: membershipError } = await admin
        .from("committee_memberships")
        .update({ status: "removed" })
        .eq("clerk_user_id", event.data.id);
      if (membershipError) throw membershipError;
    }

    if (event.type === "organization.created") {
      const { error } = await admin.from("committees").upsert(
        {
          organization_id: event.data.id,
          name: event.data.name,
        },
        { onConflict: "organization_id" },
      );
      if (error) throw error;
    }

    if (
      event.type === "organizationMembership.created" ||
      event.type === "organizationMembership.updated"
    ) {
      const membership = event.data;
      const organizationId = membership.organization.id;
      const clerkUserId = membership.public_user_data.user_id;
      const userName = [
        membership.public_user_data.first_name,
        membership.public_user_data.last_name,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

      const { error: committeeError } = await admin
        .from("committees")
        .upsert(
          { organization_id: organizationId, name: membership.organization.name },
          { onConflict: "organization_id" },
        );
      if (committeeError) throw committeeError;

      const { error: profileError } = await admin.from("profiles").upsert(
        {
          clerk_user_id: clerkUserId,
          display_name: userName,
          status: "active",
        },
        { onConflict: "clerk_user_id" },
      );
      if (profileError) throw profileError;

      const { data: existing } = await admin
        .from("committee_memberships")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("clerk_user_id", clerkUserId)
        .maybeSingle();

      const { error: membershipError } = await admin
        .from("committee_memberships")
        .upsert(
          {
            organization_id: organizationId,
            clerk_user_id: clerkUserId,
            role: existing?.role ?? applicationRoleFromClerkRole(membership.role),
            clerk_role: membership.role,
            status: "active",
          },
          { onConflict: "organization_id,clerk_user_id" },
        );
      if (membershipError) throw membershipError;
    }

    if (event.type === "organizationMembership.deleted") {
      const { error } = await admin
        .from("committee_memberships")
        .update({ status: "removed" })
        .eq("organization_id", event.data.organization.id)
        .eq("clerk_user_id", event.data.public_user_data.user_id);
      if (error) throw error;
    }

    await markWebhook(admin, eventId, "processed");
    return new Response("OK", { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await markWebhook(admin, eventId, "failed", message);
    return new Response("Webhook processing failed", { status: 500 });
  }
}
