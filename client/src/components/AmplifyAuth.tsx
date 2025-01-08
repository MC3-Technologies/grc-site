import { Authenticator } from "@aws-amplify/ui-react";

// import "@aws-amplify/ui-react/styles.css";
import { getAmplify } from "../amplify/amplify";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";

const AmplifyAuth = () => {
  const [loading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    getAmplify();
    setIsLoading(false);
  }, []);

  return (
    <>
      {loading ? (
        <>
          <Spinner />
        </>
      ) : (
        <>
          <Authenticator>
            {({ signOut }) => <button onClick={signOut}>Sign out</button>}
          </Authenticator>
        </>
      )}
    </>
  );
};

export default AmplifyAuth;
