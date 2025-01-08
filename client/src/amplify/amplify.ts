import { Amplify } from "aws-amplify";
import { signUp, confirmSignUp, getCurrentUser } from "aws-amplify/auth";

import outputs from "../../../amplify_outputs.json";

Amplify.configure(outputs);

const handleSignUp = async (
  email: string,
  password: string,
  confirmPassword: string
) => {
  if (password !== confirmPassword) {
    throw Error("Passwords don't match");
  }

  const { isSignUpComplete, userId, nextStep } = await signUp({
    username: email,
    password: password,
  });
  console.log(isSignUpComplete);
  console.log(userId);
  return nextStep;
};

const handleConfirmSignUp = async (email: string, confirmCode: string) => {
  const { isSignUpComplete, nextStep } = await confirmSignUp({
    username: email,
    confirmationCode: confirmCode,
  });
  console.log(isSignUpComplete);
  return nextStep;
};

const loggedInRedirect = async () => {
  const { username, userId } = await getCurrentUser();
  if (username && userId) {
    window.location.href = "/";
  }
};

export { handleSignUp, handleConfirmSignUp, loggedInRedirect };
