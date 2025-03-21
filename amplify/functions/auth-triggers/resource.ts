// File: amplify/functions/auth-triggers/resource.ts
import { defineFunction } from "@aws-amplify/backend";

// In Amplify Gen 2, API endpoints are injected at deployment time
export const preSignUpFunction = defineFunction({
  name: "pre-signup",
  entry: "./handler.ts",
  environment: {
    USER_STATUS_TABLE: process.env.USER_STATUS_TABLE || "UserStatus",
    REGION: process.env.REGION || "us-east-1",
  },
});
