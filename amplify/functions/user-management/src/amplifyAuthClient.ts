import { env } from "$amplify/env/user-management";
import {
  CognitoIdentityProviderClient,
  AdminGetUserCommand,
  AdminCreateUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  ListUsersCommand,
  AdminListGroupsForUserCommand,
  AdminConfirmSignUpCommand,
  AdminSetUserPasswordCommand,
  MessageActionType,
  AttributeType,
} from "@aws-sdk/client-cognito-identity-provider";

// Get the user pool ID from Amplify environment variables
const getUserPoolId = (): string => {
  const userPoolId = env.AMPLIFY_AUTH_USERPOOL_ID;
  if (!userPoolId) {
    throw new Error("AMPLIFY_AUTH_USERPOOL_ID environment variable is not set");
  }
  return userPoolId;
};

// Create Cognito client
const getCognitoClient = (): CognitoIdentityProviderClient => {
  return new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION!,
  });
};

// Amplify Auth operations that use the branch-specific user pool
export const amplifyAuthOperations = {
  async getUser(email: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    try {
      const command = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email,
      });
      const response = await cognito.send(command);
      return response;
    } catch (error: any) {
      if (error.name === "UserNotFoundException") {
        return null;
      }
      throw error;
    }
  },

  async listUsers(limit = 50, nextToken?: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: limit,
      PaginationToken: nextToken,
    });

    return await cognito.send(command);
  },

  async createUser(params: {
    email: string;
    attributes: AttributeType[];
    temporaryPassword?: string;
    sendWelcomeEmail?: boolean;
  }) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: params.email,
      UserAttributes: params.attributes,
      TemporaryPassword: params.temporaryPassword,
      MessageAction: params.sendWelcomeEmail
        ? MessageActionType.RESEND
        : MessageActionType.SUPPRESS,
    });

    return await cognito.send(command);
  },

  async updateUserAttributes(email: string, attributes: AttributeType[]) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: attributes,
    });

    return await cognito.send(command);
  },

  async deleteUser(email: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    });

    return await cognito.send(command);
  },

  async enableUser(email: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminEnableUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    });

    return await cognito.send(command);
  },

  async disableUser(email: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminDisableUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    });

    return await cognito.send(command);
  },

  async addUserToGroup(email: string, groupName: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: email,
      GroupName: groupName,
    });

    return await cognito.send(command);
  },

  async removeUserFromGroup(email: string, groupName: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminRemoveUserFromGroupCommand({
      UserPoolId: userPoolId,
      Username: email,
      GroupName: groupName,
    });

    return await cognito.send(command);
  },

  async getUserGroups(email: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: email,
    });

    return await cognito.send(command);
  },

  async confirmUser(email: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminConfirmSignUpCommand({
      UserPoolId: userPoolId,
      Username: email,
    });

    return await cognito.send(command);
  },

  async setTemporaryPassword(email: string, temporaryPassword: string) {
    const cognito = getCognitoClient();
    const userPoolId = getUserPoolId();

    const command = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: temporaryPassword,
      Permanent: false, // This makes it a temporary password that must be changed on first login
    });

    return await cognito.send(command);
  },
};
