import { getClientSchema } from "../amplify/schema";
import { getCurrentUser } from "../amplify/auth";

/**
 * Checks if a user exists in DynamoDB and creates a record if not found
 * @returns Promise<boolean> - True if successful or record already exists, False if failed
 */
export const ensureUserRecordExists = async (): Promise<boolean> => {
  try {
    // Get current authenticated user
    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.email) {
      console.error("No authenticated user found");
      return false;
    }

    // Get the client for API operations
    const client = getClientSchema();

    // Try to fetch the user details first to see if record exists
    try {
      const response = await client.queries.getUserDetails({
        email: currentUser.email,
      });

      if (response && response.data) {
        // User record exists in DynamoDB, no need to create
        //console.log(`User record found for ${currentUser.email}`);
        return true;
      }
    } catch {
      // User likely doesn't exist in DynamoDB, we'll create it
      //console.log(
      //  `No user record found for ${currentUser.email}, creating one...`,
      //);
    }

    // Call the migration function to ensure user records are created in DynamoDB
    const createResponse = await client.mutations.migrateUsersToDynamoDB();

    if (createResponse && createResponse.data) {
      //console.log(`Successfully created record for ${currentUser.email}`);
      return true;
    } else {
      //console.error(`Failed to create record for ${currentUser.email}`);
      return false;
    }
  } catch (error) {
    console.error("Error ensuring user record exists:", error);
    return false;
  }
};
