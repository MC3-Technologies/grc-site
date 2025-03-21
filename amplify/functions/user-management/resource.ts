// File: amplify/functions/user-management/resource.ts
import { defineFunction } from "@aws-amplify/backend";
import { auth } from "../../auth/resource";

// Create the Lambda function definition
export const userManagementFunction = defineFunction({
  name: "user-management",
  entry: "./handler.ts",
  environment: {
    EMAIL_SENDER: process.env.EMAIL_SENDER || "cmmc.support@mc3technologies.com",
    // Add a LOGO_URL environment variable that can be set to the publicly accessible URL of your logo

    LOGO_URL: process.env.LOGO_URL || "https://main.d2xilxp1mil40w.amplifyapp.com/logo-transparent.png"
  },
  timeoutSeconds: 60
});
