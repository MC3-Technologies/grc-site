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
    LOGO_URL: process.env.LOGO_URL || "https://main.d2xilxp1mil40w.amplifyapp.com/logo-transparent.png",
    
    // Cognito user pool ID - we'll need to set this during deployment
    USER_POOL_ID: process.env.USER_POOL_ID || "us-west-1_10IP1yz5s", 
    
    // DynamoDB table names
    SYSTEM_SETTINGS_TABLE_NAME: "SystemSettings-fk4antj52jgh3j6qjhbhwur5qa-NONE",
    AUDIT_LOG_TABLE_NAME: "AuditLog-fk4antj52jgh3j6qjhbhwur5qa-NONE",
    COMPLETED_ASSESSMENT_TABLE_NAME: "CompletedAssessment-fk4antj52jgh3j6qjhbhwur5qa-NONE",
    IN_PROGRESS_ASSESSMENT_TABLE_NAME: "InProgressAssessment-fk4antj52jgh3j6qjhbhwur5qa-NONE",
    USER_STATUS_TABLE_NAME: "UserStatus-fk4antj52jgh3j6qjhbhwur5qa-NONE"
  },
  timeoutSeconds: 60
});

