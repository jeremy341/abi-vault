import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const middleware = clerkMiddleware();

export default function proxy(...args: Parameters<typeof middleware>) {
    if (process.env.ABI_VAULT_LOCAL_MODE === "true") return NextResponse.next();
    return middleware(...args);
}

export const config = {
    matcher: [
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico)).*)",
        "/__clerk/:path*",
        "/(api|trpc)(.*)",
    ],
};
