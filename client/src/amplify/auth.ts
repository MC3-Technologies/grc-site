import { getAmplify } from "./amplify";
import { getCurrentUser as amplifyGetCurrentUser } from "aws-amplify/auth";
import { signOut } from "aws-amplify/auth";

type User = {
  email: string;
  userId: string;
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

const signOutCurrentUser = async (): Promise<void> => {
  await signOut();
};

export { getCurrentUser, signOutCurrentUser };
export type { User };
