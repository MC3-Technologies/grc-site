import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource";
import { data } from "./data/resource";
import { chatGptFunction } from "./functions/chat-gpt/resource";
// import { osintFunction } from './functions/osint/resource';
import { userManagementFunction } from "./functions/user-management/resource";
import { assessmentStorage } from "./storage/resource";

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  chatGptFunction,
  userManagementFunction,
  // osintFunction
  assessmentStorage,
});
