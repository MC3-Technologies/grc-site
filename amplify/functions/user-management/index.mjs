// Direct emergency override handler for Lambda
export const handler = async (event) => {
  try {
    console.log("EMERGENCY INDEX.MJS HANDLER CALLED WITH EVENT:", JSON.stringify(event, null, 2));
    
    // Default to listUsers operation
    let operation = 'listUsers';
    let args = {};
    
    // Extract operation from various event structures in a safe way
    if (event && typeof event === 'object') {
      // Log the event structure for debugging
      console.log("Event structure:", Object.keys(event));
      
      // Check various possible locations for operation field
      if (event.info && event.info.fieldName) {
        operation = event.info.fieldName;
        args = event.arguments || {};
      } 
      else if (event.field) {
        operation = event.field;
        args = event.arguments || {};
      }
      else if (event.operation) {
        operation = event.operation;
        args = event;
      }
    }
    
    console.log(`Processing operation: ${operation} with arguments:`, args);
    
    // Import our operations - but we need to do this dynamically
    // since this is ESM and we can't require()
    const { userOperations } = await import('./src/userOperations.js');
    
    // Execute the appropriate operation
    switch (operation) {
      case 'listUsers':
        return await userOperations.listUsers();
        
      case 'getUsersByStatus':
        return await userOperations.getUsersByStatus(args.status || '');
        
      case 'getUserDetails':
        if (!args.email) {
          return JSON.stringify({ error: "Email is required" });
        }
        return await userOperations.getUserDetails(args.email);
        
      case 'approveUser':
        if (!args.email) {
          return JSON.stringify({ error: "Email is required" });
        }
        return await userOperations.approveUser(args.email);
        
      case 'rejectUser':
        if (!args.email) {
          return JSON.stringify({ error: "Email is required" });
        }
        return await userOperations.rejectUser(args.email, args.reason);
        
      case 'suspendUser':
        if (!args.email) {
          return JSON.stringify({ error: "Email is required" });
        }
        return await userOperations.suspendUser(args.email, args.reason);
        
      case 'reactivateUser':
        if (!args.email) {
          return JSON.stringify({ error: "Email is required" });
        }
        return await userOperations.reactivateUser(args.email);
        
      case 'createUser':
        if (!args.email || !args.role) {
          return JSON.stringify({ error: "Email and role are required" });
        }
        return await userOperations.createUser(args.email, args.role, args.sendEmail);
        
      default:
        console.log(`Unknown operation: ${operation}, falling back to listUsers`);
        return await userOperations.listUsers();
    }
  } catch (error) {
    console.error("EMERGENCY HANDLER ERROR:", error);
    
    // Return a safe response rather than throwing
    return JSON.stringify({
      users: [],
      error: error instanceof Error ? error.message : String(error)
    });
  }
}; 