import { defineAuth } from "@aws-amplify/backend";
import { authTriggersFunction } from "../functions/auth-triggers/resource";
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

  multifactor: {
    mode: "REQUIRED",
    totp: true,
  },

  userAttributes: {
    "custom:role": {
      dataType: "String",
      mutable: true,
    },
    "custom:status": {
      dataType: "String",
      mutable: true,
    },
    "custom:firstName": {
      dataType: "String",
      mutable: true,
    },
    "custom:lastName": {
      dataType: "String",
      mutable: true,
    },
    "custom:companyName": {
      dataType: "String",
      mutable: true,
    },
  },

  groups: ["GRC-Admin", "Approved-Users"],

  triggers: {
    preSignUp: authTriggersFunction,
    postConfirmation: authTriggersFunction,
  },
});
