import { defineAuth } from "@aws-amplify/backend";
import { preSignUpFunction } from "../functions/auth-triggers/resource";
/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "Welcome to MC3's GRC Website!",
      verificationEmailBody: (createCode) =>
        `Use this code to confirm your account: ${createCode()}`,
    },
  },

  userAttributes: {
    "custom:role": {
      dataType: "String",
      mutable: true,
    },
  },

  groups: ["GRC-Admin", "Approved-Users"],

  triggers: {
    preSignUp: preSignUpFunction,
  },
});
