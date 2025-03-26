import { getAmplify } from "./amplify";
import { getCurrentUser as amplifyGetCurrentUser } from "aws-amplify/auth";
import { signOut } from "aws-amplify/auth";
import { fetchUserAttributes } from "aws-amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";
import { redirectHome } from "../utils/routing";

type User = {
  email: string;
  userId: string;
};

type HubPayload = {
  event: string;
  message?: string;
};

type ListenData = {
  payload: HubPayload;
};

const getCurrentUser = async (): Promise<User> => {
  getAmplify();
  try {
    const { userId, signInDetails } = await amplifyGetCurrentUser();
    if (!signInDetails || !signInDetails.loginId) {
      throw new Error("User login ID is missing");
    }
    const user: User = { email: signInDetails.loginId, userId };
    return user;
  } catch (e) {
    throw new Error(e instanceof Error ? e.message : String(e));
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

const signOutCurrentUser = async (): Promise<void> => {
  await signOut();
  redirectHome();
};

const isUserAccountActive = async (): Promise<boolean> => {
  const userAttributes = await fetchUserAttributes();
  return (
    userAttributes.email_verified === "true" &&
    userAttributes["custom:status"] !== "SUSPENDED"
  );
};

const getUserAccountStatus = async (): Promise<string> => {
  const userAttributes = await fetchUserAttributes();
  return userAttributes["custom:status"] || "PENDING";
};

export {
  getCurrentUser,
  signOutCurrentUser,
  isLoggedIn,
  isCurrentUserAdmin,
  isCurrentUserVerified,
  isUserAccountActive,
  getUserAccountStatus,
};
export type { User, ListenData };
