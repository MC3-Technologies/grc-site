import { CognitoIdentityProviderClient } from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Try to import env variables, fallback to process.env if not available
let amplifyEnv: any;
try {
  // In Amplify Gen 2, this gets resolved during deployment
  amplifyEnv = require("$amplify/env/pre-signup").env;
} catch (error) {
  console.log("Using process.env fallback");
  amplifyEnv = process.env;
}

// Initialize clients
const cognito = new CognitoIdentityProviderClient();
const dynamoClient = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// User status operations
export const userStatusOperations = {
  /**
   * Creates a new user status record in the UserStatus table
   * @param email The user's email address
   * @returns Promise<boolean> Success status
   */
  createPendingUserStatus: async (email: string): Promise<boolean> => {
    try {
      // Set up user with pending status in UserStatus table
      const userStatusData = {
        id: email,
        email: email,
        status: "pending",
        role: "user",
        registrationDate: new Date().toISOString(),
      };

      // Define the table name from environment or default
      const tableName = amplifyEnv.USER_STATUS_TABLE || "UserStatus";

      // Write directly to DynamoDB
      const putCommand = new PutCommand({
        TableName: tableName,
        Item: userStatusData,
      });

      await docClient.send(putCommand);

      console.log(`Created UserStatus record for ${email} with pending status`);
      return true;
    } catch (error) {
      console.error(`Error creating UserStatus for ${email}:`, error);
      // If this is not critical for the sign-up flow, we can continue
      return false;
    }
  },
};
