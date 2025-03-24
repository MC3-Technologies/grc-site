import { CognitoIdentityProviderClient, AdminDisableUserCommand, AdminEnableUserCommand } from "@aws-sdk/client-cognito-identity-provider";

// Initialize Cognito client
const cognito = new CognitoIdentityProviderClient();

export const cognitoOperations = {
  /**
   * Disable a user in Cognito
   * @param userPoolId The ID of the user pool
   * @param username The username (email) of the user to disable
   * @returns Promise<boolean> Success status
   */
  disableUser: async (userPoolId: string, username: string): Promise<boolean> => {
    try {
      const command = new AdminDisableUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      });

      await cognito.send(command);
      console.log(`Disabled user ${username} in pool ${userPoolId}`);
      return true;
    } catch (error) {
      console.error(`Error disabling user ${username}:`, error);
      return false;
    }
  },

  /**
   * Enable a user in Cognito
   * @param userPoolId The ID of the user pool
   * @param username The username (email) of the user to enable
   * @returns Promise<boolean> Success status
   */
  enableUser: async (userPoolId: string, username: string): Promise<boolean> => {
    try {
      const command = new AdminEnableUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      });

      await cognito.send(command);
      console.log(`Enabled user ${username} in pool ${userPoolId}`);
      return true;
    } catch (error) {
      console.error(`Error enabling user ${username}:`, error);
      return false;
    }
  },
}; 