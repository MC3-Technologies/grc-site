import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { chatGptFunction } from './backend/function/chatGpt/resource';
import { osintFunction } from './functions/osint/resource';

/**
 * @see https://docs.amplify.aws/react/build-a-backend/ to add storage, functions, and more
 */
defineBackend({
  auth,
  data,
  chatGptFunction,
  osintFunction
});
