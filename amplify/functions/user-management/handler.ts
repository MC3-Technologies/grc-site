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
    "getAllUsers",
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

      case "getAllUsers":
        return await userOperations.getAllUsers();

      case "getUsersByStatus":
        return await userOperations.getUsersByStatus(event.arguments?.status);

      case "getUserDetails":
        return await userOperations.getUserDetails(event.arguments?.email);

      case "getUserProfile":
        return await userOperations.getUserProfile(event.arguments?.email);

      case "getAdminStats":
        //console.log("[DEBUG] getAdminStats operation START");
        const stats = await userOperations.getAdminStats();
        // Convert to string since we're returning JSON
        //console.log(
        //  `[DEBUG] getAdminStats operation COMPLETE - result=${JSON.stringify(stats)}`,
        //);
        return JSON.stringify(stats);

      case "getAuditLogs":
        //console.log(
        //  `[DEBUG] getAuditLogs operation START - dateRange=${JSON.stringify(event.arguments?.dateRange)}, filters=${JSON.stringify(event.arguments?.filters)}`,
        //);
        const auditLogs = await userOperations.getAuditLogs(
          event.arguments?.dateRange,
          event.arguments?.filters,
        );
        //console.log(
        //  `[DEBUG] getAuditLogs operation COMPLETE - result=${JSON.stringify(auditLogs)}`,
        //);
        return auditLogs;

      case "approveUser":
        //console.log(
        //  `[DEBUG] approveUser operation START - email=${event.arguments?.email}, adminEmail=${event.arguments?.adminEmail}`,
        //);
        const approveResult = await userOperations.approveUser(
          event.arguments?.email,
          event.arguments?.adminEmail,
        );
        //console.log(
        //  `[DEBUG] approveUser operation COMPLETE - result=${JSON.stringify(approveResult)}`,
        //);
        return approveResult;

      case "rejectUser":
        //console.log(
        //  `[DEBUG] rejectUser operation START - email=${event.arguments?.email}, reason=${event.arguments?.reason}, adminEmail=${event.arguments?.adminEmail}`,
        //);
        const rejectResult = await userOperations.rejectUser(
          event.arguments?.email,
          event.arguments?.reason,
          event.arguments?.adminEmail,
        );
        //console.log(
        //  `[DEBUG] rejectUser operation COMPLETE - result=${JSON.stringify(rejectResult)}`,
        //);
        return rejectResult;

      case "suspendUser":
        //console.log(
        //  `[DEBUG] suspendUser operation START - email=${event.arguments?.email}, reason=${event.arguments?.reason}, adminEmail=${event.arguments?.adminEmail}`,
        //);
        const suspendResult = await userOperations.suspendUser(
          event.arguments?.email,
          event.arguments?.reason,
          event.arguments?.adminEmail,
        );
        //console.log(
        //  `[DEBUG] suspendUser operation COMPLETE - result=${JSON.stringify(suspendResult)}`,
        //);
        return suspendResult;

      case "reactivateUser":
        //console.log(
        //  `[DEBUG] reactivateUser operation START - email=${event.arguments?.email}, adminEmail=${event.arguments?.adminEmail}`,
        //);
        const reactivateResult = await userOperations.reactivateUser(
          event.arguments?.email,
          event.arguments?.adminEmail,
        );
        //console.log(
        //  `[DEBUG] reactivateUser operation COMPLETE - result=${JSON.stringify(reactivateResult)}`,
        //);
        return reactivateResult;

      case "createUser":
        //console.log(
        //  `[DEBUG] createUser operation START - email=${event.arguments?.email}, role=${event.arguments?.role}, sendEmail=${event.arguments?.sendEmail}, adminEmail=${event.arguments?.adminEmail}`,
        //);
        const createResult = await userOperations.createUser(
          event.arguments?.email,
          event.arguments?.role,
          event.arguments?.sendEmail,
          event.arguments?.adminEmail,
          event.arguments?.firstName, // Pass firstName
          event.arguments?.lastName, // Pass lastName
          event.arguments?.companyName, // Pass companyName
        );
        //console.log(
        //  `[DEBUG] createUser operation COMPLETE - result=${JSON.stringify(createResult)}`,
        //);
        return createResult;

      case "updateUserRole":
        //console.log(
        //  `[DEBUG] updateUserRole operation START - email=${event.arguments?.email}, role=${event.arguments?.role}, adminEmail=${event.arguments?.adminEmail}`,
        //);
        const updateRoleResult = await userOperations.updateUserRole(
          event.arguments?.email,
          event.arguments?.role,
          event.arguments?.adminEmail,
        );
        //console.log(
        //  `[DEBUG] updateUserRole operation COMPLETE - result=${JSON.stringify(updateRoleResult)}`,
        //);
        return updateRoleResult;

      case "updateUserProfile": // Add case for the new mutation
        //console.log(
        //  `[DEBUG] updateUserProfile operation START - email=${event.arguments?.email}, firstName=${event.arguments?.firstName}, lastName=${event.arguments?.lastName}, companyName=${event.arguments?.companyName}, adminEmail=${event.arguments?.adminEmail}`,
        //);
        const updateProfileResult = await userOperations.updateUserProfile(
          event.arguments?.email,
          event.arguments?.firstName,
          event.arguments?.lastName,
          event.arguments?.companyName,
          event.arguments?.adminEmail,
        );
        //console.log(
        //  `[DEBUG] updateUserProfile operation COMPLETE - result=${JSON.stringify(updateProfileResult)}`,
        //);
        return updateProfileResult;

      case "deleteUser":
        //console.log(
        //  `[DEBUG] deleteUser operation START - email=${event.arguments?.email}, adminEmail=${event.arguments?.adminEmail}`,
        //);
        const deleteResult = await userOperations.deleteUser(
          event.arguments?.email,
          event.arguments?.adminEmail,
        );
        //console.log(
        //  `[DEBUG] deleteUser operation COMPLETE - result=${JSON.stringify(deleteResult)}`,
        //);
        return deleteResult;

      case "getAllSystemSettings":
        //console.log("Executing getAllSystemSettings operation");
        return await userOperations.getAllSystemSettings();

      case "updateSystemSettingsConfig":
        //console.log("Executing updateSystemSettingsConfig operation");
        return await userOperations.updateSystemSettings(
          event.arguments?.settings,
          event.arguments?.updatedBy,
        );

      case "migrateUsersToDynamoDB":
        //console.log("Executing migrateUsersToDynamoDB operation");
        return await userOperations.migrateUsersToDynamoDB();

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
