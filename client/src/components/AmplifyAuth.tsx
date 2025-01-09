import { Authenticator } from "@aws-amplify/ui-react";

import { getAmplify } from "../amplify/amplify";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";

interface Props {
  initalTab?: "signUp" | "forgotPassword";
}

const AmplifyAuth = (props: Props) => {
  const [loading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAmplify();
    setIsLoading(false);
  }, []);

  const getAuthenticator = (): JSX.Element => {
    const { initalTab } = props;
    if (!initalTab) {
      return (
        <Authenticator>
          {({ signOut }) => <button onClick={signOut}>Sign out</button>}
        </Authenticator>
      );
    }
    return (
      <Authenticator initialState={initalTab}>
        {({ signOut }) => <button onClick={signOut}>Sign out</button>}
      </Authenticator>
    );
  };

  return (
    <>
      {loading ? (
        <>
          <Spinner />
        </>
      ) : (
        <>{getAuthenticator()}</>
      )}
    </>
  );
};

export default AmplifyAuth;
