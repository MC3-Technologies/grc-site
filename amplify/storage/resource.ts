import { defineStorage } from "@aws-amplify/backend";

export const assessmentStorage = defineStorage({
  name: "assessmentStorage",
  access: (allow) => ({
    "assessments/{entity_id}/*": [
      allow.entity("identity").to(["read", "write", "delete"]),
    ],
  }),
  isDefault: true,
});
