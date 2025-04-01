import { defineStorage } from "@aws-amplify/backend";
import * as s3 from 'aws-cdk-lib/aws-s3';

export const assessmentStorage = defineStorage({
  name: "assessmentStorage",
  access: (allow) => ({
    // Rule for individual users accessing their own assessments
    "assessments/{entity_id}/*": [
      allow.entity("identity").to(["get", "list", "write", "delete"]),
      allow.groups(["Approved-Users"]).to(["get", "list", "write", "delete"]),
      allow.groups(["GRC-Admin"]).to(["get", "list", "write", "delete"]), // Explicitly grant Approved-Users access to their own path
    ],
    // Broad rule for Admins to access ALL assessments
    // "assessments/*": [
    //   allow.groups(["GRC-Admin"]).to(["read", "write", "delete"]),
    // ],
    // Questionnaire access rules (unchanged)
    "questionnaire/*": [
      allow.groups(["GRC-Admin"]).to(["get", "list", "write", "delete"]),
      allow.groups(["Approved-Users"]).to(["get", "list"]),
    ],
  }),
  isDefault: true,
  versioned: true
});
