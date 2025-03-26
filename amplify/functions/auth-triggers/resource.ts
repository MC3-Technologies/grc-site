// File: amplify/functions/auth-triggers/resource.ts
import { defineFunction } from "@aws-amplify/backend";

// In Amplify Gen 2, API endpoints are injected at deployment time
export const preSignUpFunction = defineFunction({
  entry: "handler.ts",
  environment: {
    USER_STATUS_TABLE:
      process.env.USER_STATUS_TABLE ||
      "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE",
    REGION: process.env.REGION || "us-west-1",
    ADMIN_EMAIL: process.env.ADMIN_EMAIL || "cmmc.support@mc3technologies.com",
    FROM_EMAIL: process.env.FROM_EMAIL || "cmmc.support@mc3technologies.com",
    ADMIN_URL: process.env.ADMIN_URL || "http://localhost:5173/admin/",
    ADMIN_NOTIFICATION_TOPIC_ARN:
      process.env.ADMIN_NOTIFICATION_TOPIC_ARN || "",
    SES_CONFIGURATION_SET: process.env.SES_CONFIGURATION_SET || "",
    DEBUG_EMAIL: process.env.DEBUG_EMAIL || "false",
  },
});
