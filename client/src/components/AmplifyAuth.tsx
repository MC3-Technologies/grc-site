import { Authenticator } from "@aws-amplify/ui-react";
import { getAmplify } from "../amplify/amplify";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser, ListenData } from "../amplify/auth";
import { redirectHome } from "../utils/routing";

interface Props {
  initialTab?: "signUp" | "forgotPassword";
}

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
    const hubListener = Hub.listen("auth", (data: ListenData) => {
      if (data.payload.event !== "signedIn") {
        setAuthEvents(data);
      }
      redirectHome();
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
    <Authenticator
      {...(initialTab ? { initialState: initialTab } : {})}
      components={components}
    >
      <Spinner />
    </Authenticator>
  );
};

export default AmplifyAuth;
