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

  // Extract user attributes, including profile data more robustly
  const userAttributes = event.request.userAttributes || {};
  const email = userAttributes.email;
  const firstName = userAttributes.given_name || userAttributes["custom:firstName"]; // Check both standard and custom
  const lastName = userAttributes.family_name || userAttributes["custom:lastName"]; // Check both standard and custom
  const companyName = userAttributes["custom:companyName"];

  // Ensure email exists before proceeding
  if (!email) {
      console.error("Email not found in pre-signup event. Cannot create UserStatus record.");
      // Optionally throw an error to prevent signup if email is mandatory
      // throw new Error("Email is required for signup.");
      return event; // Allow signup but log error
  }

  const profileData = { firstName, lastName, companyName };
  console.log("Extracted profile data for pre-signup:", profileData);

  try {
    // NOTE: Removed createPendingUserStatus call from PreSignUp. 
    // It will be handled on admin approval, not during signup triggers.
    // const result = await userStatusOperations.createPendingUserStatus(email, profileData);
    // if (!result) {
    //   console.warn(
    //     `Warning: Could not create UserStatus record for ${email}, but continuing sign-up process`,
    //   );
    // }

    // Continue with the sign-up process - validation checks could go here if needed.
    console.log(`PreSignUp for ${email} completed. Allowing signup.`);
    return event; // Allow signup
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

  try {
    // Extract user attributes, including profile data more robustly
    const userAttributes = event.request.userAttributes || {};
    const email = userAttributes.email;
    const userPoolId = event.userPoolId;
    
    if (!email) {
        console.error("❌ Email not found in post-confirmation event. Cannot process.");
        return event; // Exit gracefully
    }
    
    // Get all possible sources of user attributes
    const firstName = userAttributes["given_name"] || userAttributes["custom:firstName"] || '';
    const lastName = userAttributes["family_name"] || userAttributes["custom:lastName"] || '';
    const companyName = userAttributes["custom:companyName"] || '';
    
    // Log all extracted attributes to debug
    console.log("User attributes for DynamoDB record:", {
      email,
      firstName, 
      lastName,
      companyName,
      allAttributes: userAttributes
    });
    
    // Create the profile data with all available attributes
    const profileData = {
      firstName,
      lastName,
      companyName
    };

    // Step 1: Create the user record in DynamoDB upon confirmation
    console.log("[PostConfirmation] Attempting to create initial DynamoDB record with status: pending");
    try {
      const dbRecordCreated = await userStatusOperations.createPendingUserStatus(email, profileData);
      if (dbRecordCreated) {
        console.log(`[PostConfirmation] ✅ Successfully created initial pending DynamoDB record for user: ${email}`);
      } else {
        console.warn(`[PostConfirmation] ⚠️ createPendingUserStatus returned false for ${email}.`);
        // Continue the process even if DB creation fails initially
      }
    } catch (dbError) {
      console.error(`[PostConfirmation] ❌ Error creating initial DynamoDB record:`, dbError);
      // Continue the process even if DB creation fails initially
    }

    // Step 2: Send application review email to user
    try {
      await userStatusOperations.sendApplicationReviewEmail(email);
      console.log("✅ Application review email sent to:", email);
    } catch (emailError) {
      console.error("❌ Failed to send application review email:", emailError);
    }

    // Step 3: Notify admins about the new user
    try {
      await userStatusOperations.notifyAdminsAboutNewUser(email);
      console.log("✅ Admin notification sent for new user:", email);
    } catch (notifyError) {
      console.error("❌ Failed to notify admins:", notifyError);
    }

    // Step 4: Disable the user in Cognito until approved by an admin
    try {
      await cognitoOperations.disableUser(userPoolId, email);
      console.log("✅ User disabled in Cognito (pending approval):", email);
    } catch (cognitoError) {
      console.error("❌ Failed to disable user in Cognito:", cognitoError);
    }

    // Success - return the event to complete the post-confirmation flow
    console.log("✅ Post-confirmation process completed successfully");
    return event;
  } catch (error) {
    console.error("❌ Error in post confirmation Lambda:", error);
    // Continue with confirmation even if there's an error with our custom logic
    return event;
  }
};
