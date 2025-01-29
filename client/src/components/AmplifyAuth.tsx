import { Authenticator } from "@aws-amplify/ui-react";
import { getAmplify } from "../amplify/amplify";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser, ListenData } from "../amplify/auth";
import { signUp } from "aws-amplify/auth";

interface Props {
  initialTab?: "signUp" | "forgotPassword";
}

const redirectHome = (): void => {
  window.location.href = "/";
};

const AmplifyAuth = ({ initialTab }: Props) => {
  const [loading, setIsLoading] = useState<boolean>(true);
  const [authEvents, setAuthEvents] = useState<ListenData | null>(null);

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
    Hub.listen("auth", (data: ListenData) => {
      if (data.payload.event !== "signedIn") {
        setAuthEvents(data);
      }
      redirectHome();
    });
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
    <Authenticator
      {...(initialTab ? { initialState: initialTab } : {})}
      components={components}
      services={{
        async handleSignUp(formData) {
          const { username, password } = formData;

          try {
            const user = await signUp({
              username,
              password,
              options: {
                userAttributes: {
                  'custom:role': "user",
                },
              },
            });
            console.info("Signed up as user.");
            return user;
          } catch (error) {
            console.error("Sign Up Error:", error);
            throw error;
          }
        },
      }}
    >
      <Spinner />
    </Authenticator>
  );
};

export default AmplifyAuth;
