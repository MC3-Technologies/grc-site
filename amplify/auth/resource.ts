import { defineAuth } from "@aws-amplify/backend";
import { preSignUpFunction } from "../functions/auth-triggers/resource";
import { userManagementFunction } from "../functions/user-management/resource";
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
    "custom:status": {
      dataType: "String",
      mutable: true,
    },
  },

  groups: ["GRC-Admin", "Approved-Users"],

  triggers: {
    preSignUp: preSignUpFunction,
  },

  access: (allow) => [
    allow
      .resource(userManagementFunction)
      .to([
        "listUsers",
        "getUser",
        "createUser",
        "updateUserAttributes",
        "enableUser",
        "disableUser",
        "deleteUser",
        "setUserPassword",
        "addUserToGroup",
        "removeUserFromGroup",
      ]),
  ],
});
