import { userStatusOperations } from "./src/preSignupFunctions";
import type { Schema } from "../../data/resource";
import { cognitoOperations } from "./src/cognitoOperations";

export const handler = async (event: any) => {
  console.log("Auth trigger event:", JSON.stringify(event, null, 2));

  // Check the trigger source to determine which handler to use
  if (event.triggerSource === "PreSignUp_SignUp") {
    return handlePreSignUp(event);
  } else if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
    return handlePostConfirmation(event);
  }

  // If no specific handler, just return the event
  return event;
};

/**
 * Handle pre-sign-up event
 * This is called before the user account is created
 */
const handlePreSignUp = async (event: any) => {
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

/**
 * Handle post-confirmation event
 * This is called after the user verifies their email
 */
const handlePostConfirmation = async (event: any) => {
  console.log("Post confirmation event:", JSON.stringify(event, null, 2));

  // Extract user attributes
  const { email } = event.request.userAttributes;
  const userPoolId = event.userPoolId;

  try {
    // Send application review email to the user
    await userStatusOperations.sendApplicationReviewEmail(email);

    // Notify admins about the new user
    await userStatusOperations.notifyAdminsAboutNewUser(email);

    // Set the user as pending in the database (in case pre-signup failed)
    await userStatusOperations.createPendingUserStatus(email);

    // Disable the user until approved by an admin
    await cognitoOperations.disableUser(userPoolId, email);

    // Continue with the confirmation process
    return event;
  } catch (error) {
    console.error("Error in post confirmation Lambda:", error);
    // Continue with confirmation even if there's an error with our custom logic
    return event;
  }
};
