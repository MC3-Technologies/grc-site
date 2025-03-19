// File: amplify/functions/user-management/handler.ts
import { userOperations } from "./src/userOperations";

// Use a simple type annotation to avoid TypeScript errors
export const handler = async (event: any) => {
  try {
    const fieldName = event.info.fieldName;
    const args = event.arguments || {}; // Handle case where arguments might be undefined

    console.log(`Processing ${fieldName} operation with arguments:`, args);

    switch (fieldName) {
      case "listUsers":
        return await userOperations.listUsers();

      case "getUsersByStatus":
        return await userOperations.getUsersByStatus(args.status);

      case "getUserDetails":
        return await userOperations.getUserDetails(args.email);

      case "approveUser":
        return await userOperations.approveUser(args.email);

      case "rejectUser":
        return await userOperations.rejectUser(args.email, args.reason);

      case "suspendUser":
        return await userOperations.suspendUser(args.email, args.reason);

      case "reactivateUser":
        return await userOperations.reactivateUser(args.email);

      case "createUser":
        return await userOperations.createUser(
          args.email,
          args.role,
          args.sendEmail,
        );

      default:
        throw new Error(`Unknown field: ${fieldName}`);
    }
  } catch (error) {
    console.error(`Error in user management handler: ${error}`);
    throw error;
  }
};
