// File: amplify/functions/auth-triggers/resource.ts
import { defineFunction } from "@aws-amplify/backend";

// In Amplify Gen 2, API endpoints are injected at deployment time
export const authTriggersFunction = defineFunction({
  name: "auth-triggers",
  entry: "./handler.ts",
  environment: {
    // Define both variable names to ensure compatibility with different parts of the code
    USER_STATUS_TABLE:
      process.env.USER_STATUS_TABLE ||
      "UserStatus-jvvqiyl2bfghrnbjzog3hwam3y-NONE",
    USER_STATUS_TABLE_NAME:
      process.env.USER_STATUS_TABLE_NAME ||
      "UserStatus-jvvqiyl2bfghrnbjzog3hwam3y-NONE",
    REGION: process.env.REGION || "us-west-1",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "cmmc.support@mc3technologies.com",
    FROM_EMAIL: process.env.FROM_EMAIL || "no-reply-grc@mc3technologies.com",
    ADMIN_URL: process.env.ADMIN_URL || "#",
    ADMIN_NOTIFICATION_TOPIC_ARN:
      process.env.ADMIN_NOTIFICATION_TOPIC_ARN || "",
    SES_CONFIGURATION_SET: process.env.SES_CONFIGURATION_SET || "",
    DEBUG_EMAIL: process.env.DEBUG_EMAIL || "false",
    // Add explicit mapping to user-management environment variable names
    EMAIL_SENDER:
      process.env.EMAIL_SENDER || "no-reply-grc@mc3technologies.com",
    // Ensure the User Pool ID is available to the function
    USER_POOL_ID: process.env.USER_POOL_ID || "us-west-1_ZIDNJDzP5", // Default to persistent pool ID
  },
});
