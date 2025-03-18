// File: amplify/functions/user-management/resource.ts
import { defineFunction } from "@aws-amplify/backend";

export const userManagementFunction = defineFunction({
  name: "user-management",
  entry: "./handler.ts",
  environment: {
    AUTH_USERPOOL_ID: process.env.AUTH_USERPOOL_ID || "",
    EMAIL_SENDER: process.env.EMAIL_SENDER || "noreply@mc3technologies.org",
  },
  timeoutSeconds: 30
});