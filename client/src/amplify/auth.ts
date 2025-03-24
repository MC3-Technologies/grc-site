import { getAmplify } from "./amplify";
import { getCurrentUser as amplifyGetCurrentUser } from "aws-amplify/auth";
import { signOut } from "aws-amplify/auth";
import { fetchUserAttributes, FetchUserAttributesOutput } from "aws-amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";
import { redirectHome } from "../utils/routing";

type User = {
  email: string;
  userId: string;
  attributes?: FetchUserAttributesOutput;
};

type HubPayload = {
  event: string;
  message?: string;
};

type ListenData = {
  payload: HubPayload;
};

const getCurrentUser = async (): Promise<User | null> => {
  getAmplify();
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    console.log("Fetched session:", session);

    const attributes = await fetchUserAttributes();
    console.log("Fetched attributes:", attributes);

    const { userId, signInDetails } = await amplifyGetCurrentUser();
    if (!signInDetails || !signInDetails.loginId) {
      throw new Error("User login ID is missing");
    }

    return { email: signInDetails.loginId, userId, attributes };
  } catch (error) {
    console.error("getCurrentUser() failed:", error);
    return null;
  }
};

const isLoggedIn = async (): Promise<boolean> => {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
};

const isCurrentUserAdmin = async (): Promise<boolean> => {
  const session = await fetchAuthSession();
  if (!session || !session.tokens) {
    throw new Error(
      "No session tokens detected. Perhaps user is not logged in?",
    );
  }
  const groups = (session.tokens.accessToken.payload["cognito:groups"] ||
    []) as string[];
  return groups.includes("GRC-Admin");
};

const isCurrentUserVerified = async (): Promise<boolean> => {
  const loggedIn: boolean = await isLoggedIn();
  if (!loggedIn) {
    throw new Error("User is not logged in!");
  }
  const userAttributes = await fetchUserAttributes();
  return userAttributes.email_verified === "true";
};

const isCurrentUserApproved = async (): Promise<boolean> => {
  try {
    const attributes = await fetchUserAttributes();
    return attributes["custom:status"]?.toLowerCase() === "active";
  } catch (error) {
    console.error("Error checking if user is approved:", error);
    return false;
  }
};

// Check if user account is enabled and not in pending status
const isUserAccountActive = async (): Promise<boolean> => {
  try {
    const session = await fetchAuthSession();
    if (!session || !session.tokens) {
      return false;
    }
    
    // Check if account is enabled
    const enabled = session.tokens.accessToken.payload["cognito:enabled"];
    if (!enabled) {
      return false;
    }
    
    // Check custom status
    const status = session.tokens.accessToken.payload["custom:status"];
    if (status === "PENDING" || status === "REJECTED" || status === "SUSPENDED") {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error checking user account status:", error);
    return false;
  }
};

// Get current user status
const getUserAccountStatus = async (): Promise<string | null> => {
  try {
    const session = await fetchAuthSession();
    if (!session || !session.tokens) {
      return null;
    }
    
    if (!session.tokens.accessToken.payload["cognito:enabled"]) {
      return "DISABLED";
    }
    
    // Return custom status if available
    const status = session.tokens.accessToken.payload["custom:status"];
    return typeof status === 'string' ? status : "UNKNOWN";
  } catch (error) {
    console.error("Error getting user account status:", error);
    return null;
  }
};

const signOutCurrentUser = async (): Promise<void> => {
  await signOut();
  redirectHome();
};

export {
  getCurrentUser,
  signOutCurrentUser,
  isLoggedIn,
  isCurrentUserAdmin,
  isCurrentUserVerified,
  isCurrentUserApproved,
  isUserAccountActive,
  getUserAccountStatus,
};
export type { User, ListenData };
