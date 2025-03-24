import { Authenticator } from "@aws-amplify/ui-react";
import { getAmplify } from "../amplify/amplify";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser, ListenData } from "../amplify/auth";
import { redirectHome } from "../utils/routing";
import { fetchAuthSession, signOut, fetchUserAttributes } from "aws-amplify/auth";
import { Alert } from "./Alert";

interface Props {
  initialTab?: "signUp" | "forgotPassword";
}

const AmplifyAuth = ({ initialTab }: Props) => {
  const [loading, setIsLoading] = useState<boolean>(true);
  const [authEvents, setAuthEvents] = useState<ListenData | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          window.location.href = "/";
        }
      } catch (error) {
        console.error(error);
      }
    };
    
    checkUser();
    getAmplify();
    setIsLoading(false);
    
    const hubListener = Hub.listen("auth", async (data: ListenData) => {
      console.log("AUTH HUB EVENT:", data);
      const event = data.payload.event;
      
      if (event === "signUp") {
        setMessage({
          type: 'success',
          text: 'Account created! Please check your email to confirm your registration. After confirmation, your account will be pending approval by an administrator.'
        });
      } else if (event === "signedIn") {
        try {
          // Check user status after sign-in
          const session = await fetchAuthSession({ forceRefresh: true });
          console.log("Session after login:", session);
          const enabled = session.tokens?.accessToken?.payload["cognito:enabled"];
          const status = session.tokens?.accessToken?.payload["custom:status"];

          if (!enabled || status === "PENDING") {
            setMessage({
              type: 'error',
              text: 'Your account is pending approval. You will be notified via email when your account is approved.'
            });
            await signOut();
            return;
          }

          // Call post-login handler to check fresh attributes
          await handlePostLogin();

          // Only redirect if the user is active and enabled
          redirectHome();
        } catch (error) {
          console.error("Error checking user status:", error);
          setMessage({
            type: 'error',
            text: 'An error occurred during sign-in. Please try again.'
          });
        }
      } else {
        setAuthEvents(data);
      }
    });

    return () => {
      // Stop listening for data memory leaks
      hubListener();
    };
  }, [authEvents]);

  const components = {
    Header() {
      return (
        <a
          href="/"
          className="flex justify-center items-center text-2xl font-semibold text-gray-900 dark:text-white"
        >
          <img
            className="w-12 h-12 mr-2"
            src="/logo-transparent.png"
            alt="logo"
          />
          MC3 GRC
        </a>
      );
    },
  };

  return loading ? (
    <Spinner />
  ) : (
    <div className="max-w-md w-full mx-auto">
      {message && (
        <div className="mb-4">
          <Alert type={message.type} dismissible onDismiss={() => setMessage(null)}>
            {message.text}
          </Alert>
        </div>
      )}
      <Authenticator
        {...(initialTab ? { initialState: initialTab } : {})}
        components={components}
        signUpAttributes={['email']}
        loginMechanisms={['email']}
      >
        <Spinner />
      </Authenticator>
    </div>
  );
};

const handlePostLogin = async () => {
  try {
    const attributes = await fetchUserAttributes();
    const status = attributes["custom:status"]?.toLowerCase();

    if (status !== "active") {
      alert("Your account is pending approval. Please wait.");
      await signOut();
    } else {
      console.log("User is approved and active");
    }
  } catch (error) {
    console.error("Error in post-login check:", error);
  }
};

export default AmplifyAuth;
