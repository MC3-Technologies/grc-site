import { Authenticator } from "@aws-amplify/ui-react";

import { getAmplify } from "../amplify/amplify";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser } from "../amplify/auth";

interface Props {
  initalTab?: "signUp" | "forgotPassword";
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

  const getAuthenticator = (): JSX.Element => {
    const { initalTab } = props;
    if (!initalTab) {
      return (
        <Authenticator>
          <Spinner />
        </Authenticator>
      );
    }
    return (
      <Authenticator initialState={initalTab}>
        <Spinner />
      </Authenticator>
    );
  };

  return <>{loading ? <Spinner /> : getAuthenticator()}</>;
};

export default AmplifyAuth;
