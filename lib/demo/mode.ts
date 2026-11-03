export function isDemoData() {
  const isOpenSourceDemoDeployment =
    process.env.VERCEL === "1" &&
    process.env.VERCEL_GIT_COMMIT_REF === "open-source-demo";

  return process.env.ABI_VAULT_DEMO_DATA === "true" || isOpenSourceDemoDeployment;
}
