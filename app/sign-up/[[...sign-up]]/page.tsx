import SignUpPage from "./signup-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const { redirect_url: redirectUrl } = await searchParams;
  return <SignUpPage redirectUrl={redirectUrl?.startsWith("/") ? redirectUrl : "/dashboard"} />;
}
