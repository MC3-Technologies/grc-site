import { defineBackend } from "@aws-amplify/backend";
import { auth as authResourceFactory } from "./auth/resource";
import { data } from "./data/resource";
import { chatGptFunction } from "./functions/chat-gpt/resource";
import { audioTranscriber } from "./functions/openai-whisper/resource";
import { userManagementFunction } from "./functions/user-management/resource";
import { assessmentStorage } from "./storage/resource";
import { authTriggersFunction } from "./functions/auth-triggers/resource";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";

// ===== Define backend resources =====
const backend = defineBackend({
  auth: authResourceFactory,
  data,
  chatGptFunction,
  userManagementFunction,
  assessmentStorage,
  authTriggersFunction,
  audioTranscriber,
});

const httpApi = new apigwv2.HttpApi(backend.stack, "ChatbotHttpApi", {
  apiName: "chatbot-api",
  corsPreflight: {
    allowOrigins: ["*"], // adjust for prod
    allowMethods: [apigwv2.CorsHttpMethod.POST],
    allowHeaders: ["*"],
  },
});

// POST /transcribe → audioTranscriber Lambda
httpApi.addRoutes({
  path: "/transcribe",
  methods: [apigwv2.HttpMethod.POST],
  integration: new integrations.HttpLambdaIntegration(
    "AudioTranscriberIntegration",
    backend.audioTranscriber.resources.lambda
  ),
});

backend.userManagementFunction.addEnvironment(
  "AMPLIFY_AUTH_USERPOOL_ID",
  backend.auth.resources.userPool.userPoolId,
);

const { cfnResources } = backend.data.resources;
const cfnGraphqlApi = cfnResources.cfnGraphqlApi;
backend.userManagementFunction.addEnvironment(
  "API_ENDPOINT",
  cfnGraphqlApi.attrGraphQlUrl,
);

const tables = backend.data.resources.tables;
Object.entries(tables).forEach(([modelName, table]) => {
  backend.userManagementFunction.addEnvironment(
    `${modelName.toUpperCase()}_TABLE_NAME`,
    table.tableName
  );
});

if (tables.UserStatus) {
  backend.userManagementFunction.addEnvironment(
    "USERSTATUS_TABLE_NAME",
    tables.UserStatus.tableName
  );
}
if (tables.AuditLog) {
  backend.userManagementFunction.addEnvironment(
    "AUDITLOG_TABLE_NAME",
    tables.AuditLog.tableName
  );
}

backend.authTriggersFunction.addEnvironment(
  "AMPLIFY_BRANCH_TAG",
  backend.stack.stackName
);

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
  })
);

backend.userManagementFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: ["appsync:GraphQL"],
    resources: [
      `arn:aws:appsync:${backend.stack.region}:${backend.stack.account}:apis/${cfnGraphqlApi.attrApiId}/*`,
    ],
  })
);

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
  })
);

backend.authTriggersFunction.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ["ses:SendEmail", "ses:SendRawEmail"],
    resources: ["*"],
  })
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
  })
);

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
  })
);

backend.authTriggersFunction.addEnvironment("USERSTATUS_PARAM", paramName);