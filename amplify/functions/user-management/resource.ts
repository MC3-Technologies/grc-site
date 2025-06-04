// File: amplify/functions/user-management/resource.ts
import { defineFunction } from "@aws-amplify/backend";

// Create the Lambda function definition
export const userManagementFunction = defineFunction({
  name: "user-management",
  entry: "./handler.ts",
  // Assign to data stack since this function acts as a data resolver
  resourceGroupName: "data",
  environment: {
    EMAIL_SENDER:
      process.env.EMAIL_SENDER || "no-reply-grc@mc3technologies.com",
    LOGO_URL:
      process.env.LOGO_URL ||
      "https://main.d2xilxp1mil40w.amplifyapp.com/logo-transparent.png",
    FROM_EMAIL: process.env.FROM_EMAIL || "no-reply-grc@mc3technologies.com",
  },
  timeoutSeconds: 60,
});
