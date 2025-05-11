import { Authenticator } from "@aws-amplify/ui-react";
import { getAmplify } from "../amplify/amplify";
import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import { Hub } from "aws-amplify/utils";
import { getCurrentUser, ListenData } from "../amplify/auth";
import { redirectHome } from "../utils/routing";
import { ensureUserRecordExists } from "../utils/autoCreateUserRecord";
import { updatePassword } from "aws-amplify/auth";

interface Props {
  initialTab?: "signUp" | "forgotPassword";
  initialState?: "signIn" | "signUp" | "forgotPassword";
}

// Component for changing password
const ChangePasswordForm = () => {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Use the getCurrentAuthenticatedUser and updatePassword from aws-amplify/auth
      await updatePassword({ oldPassword, newPassword });
      
      setSuccess("Password changed successfully!");
      setOldPassword("");
      setNewPassword("");
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An error occurred while changing your password.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
      <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
        <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
          Change Your Password
        </h1>
        {error && (
          <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
            <span className="font-medium">Error!</span> {error}
          </div>
        )}
        {success && (
          <div className="p-4 mb-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
            <span className="font-medium">Success!</span> {success}
          </div>
        )}
        <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="oldPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Current Password</label>
            <input
              type="password"
              name="oldPassword"
              id="oldPassword"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">New Password</label>
            <input
              type="password"
              name="newPassword"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
          >
            {loading ? (
              <>
                <svg aria-hidden="true" role="status" className="inline w-4 h-4 mr-3 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
                  <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
                </svg>
                Changing...
              </>
            ) : "Change Password"}
          </button>
          <div className="text-sm font-light text-gray-500 dark:text-gray-400">
            <a href="/" className="font-medium text-primary-600 hover:underline dark:text-primary-500">Back to Home</a>
          </div>
        </form>
      </div>
    </div>
  );
};

const AmplifyAuth = ({ initialTab, initialState }: Props) => {
  const [loading, setIsLoading] = useState<boolean>(true);
  const [authEvents, setAuthEvents] = useState<ListenData | null>(null);
  
  // Check if we're in change password mode
  const params = new URLSearchParams(window.location.search);
  const modeParam = params.get("mode");
  const isChangePasswordMode = modeParam === "change-password";

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Don't redirect if the user is trying to change their password
          if (!isChangePasswordMode) {
            // Ensure the user has a DynamoDB record before redirecting
            await ensureUserRecordExists();
            window.location.href = "/";
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    checkUser();
    getAmplify();
    setIsLoading(false);
    const hubListener = Hub.listen("auth", async (data: ListenData) => {
      if (data.payload.event === "signedIn") {
        // User just signed in, ensure they have a DynamoDB record
        await ensureUserRecordExists();
      } else {
        setAuthEvents(data);
      }
      
      // Don't redirect if in change password mode
      if (!isChangePasswordMode) {
        redirectHome();
      }
    });

    return () => {
      // Stop listening for data memory leaks
      hubListener();
    };
  }, [authEvents, isChangePasswordMode]);

  const formFields = {
    signUp: {
      given_name: {
        order: 1,
        isRequired: true,
        placeholder: "Enter your First Name",
        label: "First Name",
      },
      family_name: {
        order: 2,
        isRequired: true,
        placeholder: "Enter your Last Name",
        label: "Last Name",
      },
      "custom:companyName": {
        order: 3,
        isRequired: true,
        placeholder: "Enter your Company Name",
        label: "Company Name",
      },
      email: {
        order: 4,
        isRequired: true,
        placeholder: "Enter your Email",
        label: "Email",
      },
      password: {
        order: 5,
        isRequired: true,
        placeholder: "Enter your Password",
        label: "Password",
      },
      confirm_password: {
        order: 6,
        isRequired: true,
        placeholder: "Confirm your Password",
        label: "Confirm Password",
      },
    },
  };

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

  // Return change password form if in that mode
  if (isChangePasswordMode) {
    return loading ? <Spinner /> : <ChangePasswordForm />;
  }

  return loading ? (
    <Spinner />
  ) : (
    <Authenticator
      initialState={initialTab || initialState}
      components={components}
      formFields={formFields}
    >
      <Spinner />
    </Authenticator>
  );
};

export default AmplifyAuth;
