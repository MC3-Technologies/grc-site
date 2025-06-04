// File: amplify/functions/auth-triggers/resource.ts
import { defineFunction } from "@aws-amplify/backend";

// This function is now a standalone function, not part of the 'auth' resource group.
// It will be associated with Cognito triggers in auth/resource.ts.
export const authTriggersFunction = defineFunction({
  name: "auth-triggers", // This will be its logical ID in its own function stack
  entry: "./handler.ts",
  resourceGroupName: "auth", // Place the function within the auth nested stack to avoid cross-stack circular deps
  environment: {
    REGION: process.env.AWS_REGION || "us-west-1",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "cmmc.support@mc3technologies.com",
    FROM_EMAIL: process.env.FROM_EMAIL || "no-reply-grc@mc3technologies.com",
    EMAIL_SENDER:
      process.env.EMAIL_SENDER || "no-reply-grc@mc3technologies.com",
    ADMIN_URL: process.env.ADMIN_URL || "#",
    // Table names and other env vars will be injected from backend.ts
  },
  timeoutSeconds: 60,
});
