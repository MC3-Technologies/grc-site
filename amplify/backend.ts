// File: amplify/backend.ts
import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { chatGptFunction } from "./functions/chat-gpt/resource";
// import { osintFunction } from './functions/osint/resource';
import { userManagementFunction } from "./functions/user-management/resource";
import { assessmentStorage } from "./storage/resource";
import { preSignUpFunction } from "./functions/auth-triggers/resource";
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

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
    actions: ['ses:SendEmail', 'ses:SendRawEmail'],
    resources: ['*']
  })
);
