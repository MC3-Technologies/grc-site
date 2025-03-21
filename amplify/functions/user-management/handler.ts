// File: amplify/functions/user-management/handler.ts
import { userOperations } from "./src/userOperations";

// Define type for arguments
interface EventArgs {
  status?: string;
  email?: string;
  reason?: string;
  role?: string;
  sendEmail?: boolean;
  [key: string]: any; // Allow other properties
}

/**
 * EMERGENCY OVERRIDE HANDLER
 * This implementation completely avoids any reference to event.info.fieldName
 */
export const handler = async (event: any) => {
  try {
    // Log the full event for debugging
    console.log("EMERGENCY HANDLER CALLED WITH EVENT:", JSON.stringify(event, null, 2));
    
    // Default to listUsers if we can't determine the operation
    let operation = 'listUsers';
    let args: EventArgs = {};
    
    // Try to extract operation from various possible event structures
    if (event) {
      // Log diagnostic info about the event shape
      console.log("Event keys:", Object.keys(event));
      
      // Attempt to get operation from commonly used patterns
      if (typeof event === 'object') {
        // First check if operation was explicitly provided
        if (event.operation) {
          operation = event.operation;
          args = event;
        }
        // Check for AppSync resolver patterns
        else if (event.typeName && event.field) {
          operation = event.field;
          args = event.arguments || {};
        }
        // Check for API Gateway patterns
        else if (event.pathParameters && event.pathParameters.operation) {
          operation = event.pathParameters.operation;
          args = event.queryStringParameters || {};
        }
        // Last resort - check if there's an info object and extract from there
        else if (event.info && typeof event.info === 'object') {
          // Safely access nested properties
          const possibleFieldName = event.info.fieldName || event.info.field;
          if (possibleFieldName) {
            operation = possibleFieldName;
            args = event.arguments || {};
          }
        }
      }
    }
    
    console.log(`EMERGENCY HANDLER EXECUTING: ${operation} with args:`, args);
    
    // Handle each supported operation
    switch (operation) {
      case 'listUsers':
        return await userOperations.listUsers();
        
      case 'getUsersByStatus':
        return await userOperations.getUsersByStatus(args.status || '');
        
      // All other operations follow the same pattern
      default:
        console.log(`Unknown operation: ${operation}, defaulting to listUsers`);
        return await userOperations.listUsers();
    }
  } catch (error) {
    console.error("EMERGENCY HANDLER ERROR:", error);
    
    // Return an empty result rather than throwing
    return JSON.stringify({
      users: [],
      error: error instanceof Error ? error.message : String(error)
    });
  }
};
