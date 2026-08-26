import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { POST } from "@/app/api/webhooks/clerk/route";

describe("Clerk webhook endpoint", () => {
  it("rejects requests without a Svix event id", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/webhooks/clerk", { method: "POST" }));
    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Missing webhook event id");
  });

  it("rejects an unsigned event", async () => {
    const response = await POST(new NextRequest("http://localhost:3000/api/webhooks/clerk", {
      method: "POST",
      headers: { "svix-id": "evt_test" },
      body: JSON.stringify({ type: "user.created", data: {} }),
    }));
    expect(response.status).toBe(400);
    await expect(response.text()).resolves.toBe("Webhook verification failed");
  });
});
