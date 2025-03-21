import { userStatusOperations } from "./src/preSignupFunctions";
import type { Schema } from "../../data/resource";

export const handler = async (event: any) => {
  console.log("Pre sign-up event:", JSON.stringify(event, null, 2));

  // Extract user attributes
  const { email } = event.request.userAttributes;

  try {
    // Create the user status record
    const result = await userStatusOperations.createPendingUserStatus(email);

    if (!result) {
      console.warn(
        `Warning: Could not create UserStatus record for ${email}, but continuing sign-up process`,
      );
    }

    // Continue with the sign-up process
    return event;
  } catch (error) {
    console.error("Error in pre sign-up Lambda:", error);
    // Continue with sign-up even if there's an error with our custom logic
    return event;
  }
};
