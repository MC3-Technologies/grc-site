import { defineStorage } from "@aws-amplify/backend";

export const assessmentStorage = defineStorage({
  name: "assessmentStorage",
  access: (allow) => ({
    "assessments/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
      allow.groups(["GRC-Admin"]).to(["read", "write", "delete"]),
    ],
    "assessments/*": [
      allow.groups(["GRC-Admin"]).to(["read", "write", "delete"]),
    ],
  }),
  isDefault: true,
  versioned: true,
});