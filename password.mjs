// password.mjs
import { Amplify } from 'aws-amplify';
import { signIn, confirmSignIn, fetchAuthSession } from '@aws-amplify/auth';
import authConfig from './authConfig.mjs'; // Externalize config

Amplify.configure(authConfig);

// Credentials
const username = 'imatar77@hawaii.edu';
const tempPassword = '3411351210Hh-';
const newPassword = 'MC3grc#2024';

async function completePasswordChallenge() {
  try {
    const user = await signIn({ username, password: tempPassword });

    if (user.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD') {
      await confirmSignIn(user, newPassword);
      console.log('✅ Password changed successfully.');

      const session = await fetchAuthSession();
      console.log('✅ Session:', session);
    } else {
      console.log('✅ Signed in without password change.');
    }
  } catch (err) {
    console.error('❌ Error during sign-in:', err);
  }
}

completePasswordChallenge();
