// File: amplify/backend.ts
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { chatGptFunction } from "./functions/chat-gpt/resource";
// import { osintFunction } from './functions/osint/resource';
import { userManagementFunction } from "./functions/user-management/resource";
import { assessmentStorage } from "./storage/resource";
import { preSignUpFunction } from "./functions/auth-triggers/resource";
import { PolicyStatement } from "aws-cdk-lib/aws-iam";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth,
  data,
  chatGptFunction,
  userManagementFunction,
  preSignUpFunction,
  // osintFunction
  assessmentStorage,
});

// Add SES permissions to the user management Lambda function
backend.userManagementFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ses:SendEmail", "ses:SendRawEmail"],
    resources: ["*"],
  }),
);

// Add DynamoDB permissions to the user management Lambda function
backend.userManagementFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
    ],
    resources: ["*"],
  }),
);

// Add Cognito permissions to the user management Lambda function
backend.userManagementFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:AdminListGroupsForUser",
      "cognito-idp:ListUsers",
    ],
    resources: ["*"],
  }),
);

// Add permissions to the preSignUp Lambda function
backend.preSignUpFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "ses:SendEmail",
      "ses:SendRawEmail",
      "sns:Publish",
    ],
    resources: ["*"],
  }),
);

// Add Cognito permissions to the auth-triggers Lambda function
backend.preSignUpFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:ListUsers",
    ],
    resources: ["*"],
  }),
);
