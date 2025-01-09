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

const AmplifyAuth = (props: Props) => {
  const [loading, setIsLoading] = useState<boolean>(true);
  const [authEvents, setAuthEvents] = useState<any>(null);

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
    Hub.listen("auth", (data) => {
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
          className="flex justify-center items-center  text-2xl font-semibold text-gray-900 dark:text-white"
        >
          <img
            className="w-12 h12 mr-2"
            src="/logo-transparent.png"
            alt="logo"
          />
          MC3 GRC
        </a>
      );
    },
  };

  const getAuthenticator = (): JSX.Element => {
    const { initialTab } = props;

    return (
      <Authenticator
        {...(initialTab ? { initialState: initialTab } : {})}
        components={components}
      >
        <Spinner />
      </Authenticator>
    );
  };

  return <>{loading ? <Spinner /> : getAuthenticator()}</>;
};

export default AmplifyAuth;
