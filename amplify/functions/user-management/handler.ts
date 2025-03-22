// File: amplify/functions/user-management/handler.ts
import { AppSyncResolverEvent } from "aws-lambda";
import { userOperations } from "./src/userOperations";
import { log } from "./src/utils";

// Define a type for AppSync-specific fields
export type AppSyncEvent = AppSyncResolverEvent<any, any> & {
  typeName?: string;
  fieldName?: string;
  info?: any;
};

/**
 * Lambda handler for user management operations
 *
 * This function processes AppSync resolver events for user management operations
 * such as listing users, getting user details, approving users, etc.
 *
 * @param event The AppSync event
 * @returns The result of the operation
 */
export const handler = async (event: AppSyncEvent): Promise<any> => {
  log.info(
    "User management handler received event:",
    JSON.stringify(event, null, 2),
  );

  // Extract operation type from the event
  const typeName = event.typeName || "Query";
  const fieldName = event.fieldName || "listUsers";

  log.info(`Event has typeName: ${typeName} and fieldName: ${fieldName}`);

  // Build the operation identifier
  const operation = `${typeName}.${fieldName}`;

  log.info(
    `Executing operation: ${operation} with args: ${JSON.stringify(event.arguments)}`,
  );

  // Define known operations to handle
  const knownOperations = [
    "listUsers",
    "getUsersByStatus",
    "getUserDetails",
    "getAdminStats",
    "getAuditLogs",
    "approveUser",
    "rejectUser",
    "suspendUser",
    "reactivateUser",
    "createUser",
    "updateUserRole",
    "deleteUser",
    "getAllSystemSettings",
    "updateSystemSettingsConfig",
  ];

  try {
    // Determine which operation to execute based on the fieldName
    switch (fieldName) {
      case "listUsers":
        return await userOperations.listUsers();

      case "getUsersByStatus":
        return await userOperations.getUsersByStatus(event.arguments?.status);

      case "getUserDetails":
        return await userOperations.getUserDetails(event.arguments?.email);

      case "getAdminStats":
        log.info("Executing getAdminStats operation");
        const stats = await userOperations.getAdminStats();
        // Convert to string since we're returning JSON
        return JSON.stringify(stats);

      case "getAuditLogs":
        return await userOperations.getAuditLogs(
          event.arguments?.dateRange,
          event.arguments?.filters,
        );

      case "approveUser":
        return await userOperations.approveUser(
          event.arguments?.email,
          event.arguments?.adminEmail,
        );

      case "rejectUser":
        return await userOperations.rejectUser(
          event.arguments?.email,
          event.arguments?.reason,
          event.arguments?.adminEmail,
        );

      case "suspendUser":
        return await userOperations.suspendUser(
          event.arguments?.email,
          event.arguments?.reason,
          event.arguments?.adminEmail,
        );

      case "reactivateUser":
        return await userOperations.reactivateUser(
          event.arguments?.email,
          event.arguments?.adminEmail,
        );

      case "createUser":
        return await userOperations.createUser(
          event.arguments?.email,
          event.arguments?.role,
          event.arguments?.sendEmail,
          event.arguments?.adminEmail,
        );

      case "updateUserRole":
        return await userOperations.updateUserRole(
          event.arguments?.email,
          event.arguments?.role,
          event.arguments?.adminEmail,
        );

      case "deleteUser":
        return await userOperations.deleteUser(
          event.arguments?.email,
          event.arguments?.adminEmail,
        );

      case "getAllSystemSettings":
        console.log("Executing getAllSystemSettings operation");
        return await userOperations.getAllSystemSettings();

      case "updateSystemSettingsConfig":
        return await userOperations.updateSystemSettings(
          event.arguments?.settings,
          event.arguments?.updatedBy,
        );

      default:
        // If operation is not recognized, log warning and default to listUsers
        log.warn(`Unknown operation: ${fieldName}, defaulting to listUsers`);
        return await userOperations.listUsers();
    }
  } catch (error) {
    // Log any errors that occur during execution
    log.error(`Error executing operation ${operation}:`, error);

    // Return error response with status code and message
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error executing operation: ${error instanceof Error ? error.message : String(error)}`,
      }),
    };
  }
};
