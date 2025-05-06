// File: amplify/functions/user-management/resource.ts
import { defineFunction } from "@aws-amplify/backend";

// Create the Lambda function definition
export const userManagementFunction = defineFunction({
  name: "user-management",
  entry: "./handler.ts",
  environment: {
    EMAIL_SENDER:
      process.env.EMAIL_SENDER || "no-reply-grc@mc3technologies.com",
    LOGO_URL:
      process.env.LOGO_URL ||
      "https://main.d2xilxp1mil40w.amplifyapp.com/logo-transparent.png",

    // Updated user pool ID as specified by user
    USER_POOL_ID: process.env.USER_POOL_ID || "us-west-1_ZIDNJDzP5",

    // DynamoDB table names - Use persistent environment names as defaults
    SYSTEM_SETTINGS_TABLE_NAME:
      process.env.SYSTEM_SETTINGS_TABLE_NAME ||
      "SystemSettings-jvvqiyl2bfghrnbjzog3hwam3y-NONE",
    AUDIT_LOG_TABLE_NAME:
      process.env.AUDIT_LOG_TABLE_NAME ||
      "AuditLog-jvvqiyl2bfghrnbjzog3hwam3y-NONE",
    COMPLETED_ASSESSMENT_TABLE_NAME:
      process.env.COMPLETED_ASSESSMENT_TABLE_NAME ||
      "CompletedAssessment-b5j4wql6m5fijablcodytncwrm-NONE",
    IN_PROGRESS_ASSESSMENT_TABLE_NAME:
      process.env.IN_PROGRESS_ASSESSMENT_TABLE_NAME ||
      "InProgressAssessment-b5j4wql6m5fijablcodytncwrm-NONE",
    USER_STATUS_TABLE_NAME:
      process.env.USER_STATUS_TABLE_NAME ||
      "UserStatus-jvvqiyl2bfghrnbjzog3hwam3y-NONE",
    FROM_EMAIL: process.env.FROM_EMAIL || "no-reply-grc@mc3technologies.com",
  },
  timeoutSeconds: 60,
});
