import { Authenticator } from "@aws-amplify/ui-react";
import { getAmplify } from "../amplify/amplify";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser } from "../amplify/auth";

interface Props {
  initialTab?: "signUp" | "forgotPassword";
}

const redirectHome = (): void => {
  window.location.href = "/";
};

const AmplifyAuth = ({ initialTab }: Props) => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          redirectHome();
          return;
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }

      getAmplify();
      const authListener = (data: any) => {
        if (data.payload.event === "signedIn") {
          redirectHome();
        }
      };
      Hub.listen("auth", authListener);
      setLoading(false);
    };

    initializeAuth();
  }, []);

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
    >
      <Spinner />
    </Authenticator>
  );
};

export default AmplifyAuth;
