// File: amplify/backend.ts
import { defineBackend } from "@aws-amplify/backend";
import { auth as authResourceFactory } from "./auth/resource"; // Renamed to avoid conflict with a potential 'auth' variable
import { data } from "./data/resource";
import { chatGptFunction } from "./functions/chat-gpt/resource";
import { userManagementFunction } from "./functions/user-management/resource";
import { assessmentStorage } from "./storage/resource";
import { authTriggersFunction } from "./functions/auth-triggers/resource";
// authTriggersFunction is placed in the auth stack via resourceGroupName: "auth" but we still
// import it so we can attach IAM policies below. We purposely avoid wiring any environment
// variables that reference resources from other stacks to prevent circular dependencies.
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
const backend = defineBackend({
  auth: authResourceFactory, // Use the aliased import
  data,
  chatGptFunction,
  userManagementFunction,
  assessmentStorage,
  authTriggersFunction,
});

// Grant the Lambda function access to Amplify resources with proper environment variables
backend.userManagementFunction.addEnvironment(
  "AMPLIFY_AUTH_USERPOOL_ID",
  backend.auth.resources.userPool.userPoolId,
);

// For Gen 2, we need to provide the GraphQL API endpoint to the Lambda function
const { cfnResources } = backend.data.resources;
const cfnGraphqlApi = cfnResources.cfnGraphqlApi;
backend.userManagementFunction.addEnvironment(
  "API_ENDPOINT",
  cfnGraphqlApi.attrGraphQlUrl,
);

// Add DynamoDB table names as environment variables
const tables = backend.data.resources.tables;
Object.entries(tables).forEach(([modelName, table]) => {
  backend.userManagementFunction.addEnvironment(
    `${modelName.toUpperCase()}_TABLE_NAME`,
    table.tableName,
  );
});

// Also add specific table names for UserStatus and AuditLog
if (tables.UserStatus) {
  backend.userManagementFunction.addEnvironment(
    "USERSTATUS_TABLE_NAME",
    tables.UserStatus.tableName,
  );
}
if (tables.AuditLog) {
  backend.userManagementFunction.addEnvironment(
    "AUDITLOG_TABLE_NAME",
    tables.AuditLog.tableName,
  );
}

// NEW: Provide a branch-specific tag so authTriggersFunction can deterministically pick its tables without cross-stack refs
backend.authTriggersFunction.addEnvironment(
  "AMPLIFY_BRANCH_TAG",
  backend.stack.stackName,
);

// Add DynamoDB permissions to the user management Lambda function
backend.userManagementFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      "ses:SendRawEmail",
      "ses:SendEmail",
      "dynamodb:Scan",
      "dynamodb:Query",
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:BatchGetItem",
      "dynamodb:BatchWriteItem",
      "cognito-idp:AdminGetUser",
      "cognito-idp:AdminCreateUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminDeleteUser",
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminEnableUser",
      "cognito-idp:AdminAddUserToGroup",
      "cognito-idp:AdminRemoveUserFromGroup",
      "cognito-idp:AdminListGroupsForUser",
      "cognito-idp:AdminSetUserPassword",
      "cognito-idp:AdminConfirmSignUp",
      "cognito-idp:ListUsers",
      "appsync:GraphQL",
    ],
    resources: ["*"],
  }),
);

// Grant the Lambda function access to query and mutate data through AppSync
backend.userManagementFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["appsync:GraphQL"],
    resources: [
      `arn:aws:appsync:${backend.stack.region}:${backend.stack.account}:apis/${cfnGraphqlApi.attrApiId}/*`,
    ],
  }),
);

// Attach IAM policies to authTriggersFunction (now in auth stack) without introducing deps
backend.authTriggersFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      "dynamodb:ListTables",
      "dynamodb:DescribeTable",
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
      "dynamodb:Query",
      "dynamodb:Scan",
    ],
    resources: ["*"],
  }),
);

backend.authTriggersFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["ses:SendEmail", "ses:SendRawEmail"],
    resources: ["*"],
  }),
);

backend.authTriggersFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: [
      "cognito-idp:AdminDisableUser",
      "cognito-idp:AdminUpdateUserAttributes",
      "cognito-idp:AdminGetUser",
    ],
    resources: ["*"],
  }),
);

// Note: Data API permissions are handled automatically by Amplify for Lambda resolvers

if (tables.UserStatus) {
  const paramName = `/grc-site/${backend.stack.stackName}/USERSTATUS_TABLE_NAME`;

  new StringParameter(backend.stack, "UserStatusParam", {
    parameterName: paramName,
    stringValue: tables.UserStatus.tableName,
  });
}

const paramName = `/grc-site/${backend.stack.stackName}/USERSTATUS_TABLE_NAME`;
backend.authTriggersFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["ssm:GetParameter"],
    resources: [
      `arn:aws:ssm:${backend.stack.region}:${backend.stack.account}:parameter${paramName}`,
    ],
  }),
);

// Pass the param name (not the value) to the function
backend.authTriggersFunction.addEnvironment("USERSTATUS_PARAM", paramName);
