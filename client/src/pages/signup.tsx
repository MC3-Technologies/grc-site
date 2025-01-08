import { StrictMode, useState, useEffect, ChangeEvent, FormEvent } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";

import {
  handleConfirmSignUp,
  handleSignUp,
  loggedInRedirect,
} from "../amplify/amplify";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export function Signup() {
  const [signedUp, setSignedUp] = useState<boolean>(false);

  const [signUpFormData, setSignUpFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [signUpFormError, setSignUpFormError] = useState(null);

  const [verifyFormData, setVerifyFormData] = useState<string>("");
  const [verifyFormError, setVerifyFormError] = useState(null);
  const [verifyFormSuccessful, setVerifyFormSuccessful] =
    useState<boolean>(false);

  useEffect(() => {
    initFlowbite();
    loggedInRedirect();
  }, []);

  const handleSignUpFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSignUpSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await handleSignUp(
        signUpFormData.email,
        signUpFormData.password,
        signUpFormData.confirmPassword
      );
      setSignUpFormError(null);
      setSignedUp(true);
    } catch (e) {
      console.log(e);
      setSignUpFormError(e as any);
    }
  };

  const handleVerifyFormChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setVerifyFormData(value);
  };

  const handleVerifyFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await handleConfirmSignUp(signUpFormData.email, verifyFormData);
      setVerifyFormError(null);
      setVerifyFormSuccessful(true);
      setTimeout(() => {
        window.location.href = "/signin/";
      }, 3000);
    } catch (e) {
      console.log(e);
      setVerifyFormError(e as any);
    }
  };

  return (
    <>
      <Navbar />
      <section className="bg-gray-50 dark:bg-gray-900 mt-20 md:mt-0">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          <a
            href="/"
            className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
          >
            <img
              className="w-12 h12 mr-2"
              src="/logo-transparent.png"
              alt="logo"
            />
            MC3 Technologies
          </a>
          <div className="w-full bg-white rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 dark:bg-gray-800 dark:border-gray-700">
            <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
              {signedUp ? (
                <>
                  <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                    Verify your account
                  </h1>
                  <p className="text-gray-900  dark:text-white">
                    A confirmation code has been sent to your email{" "}
                    {signUpFormData.email}
                  </p>
                  <form
                    className="space-y-4 md:space-y-6"
                    onSubmit={handleVerifyFormSubmit}
                  >
                    <div>
                      <label
                        htmlFor="confirmAccount"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Verification code
                      </label>
                      <input
                        type="text"
                        name="confirmAccount"
                        id="confirmAccount"
                        placeholder="••••••••"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={verifyFormData}
                        onChange={handleVerifyFormChange}
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    >
                      Verify account
                    </button>

                    {verifyFormError ? (
                      <>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                          {`* ${verifyFormError}`}
                        </p>
                      </>
                    ) : null}
                    {verifyFormSuccessful ? (
                      <>
                        <p className="text-sm font-bold text-green-600 dark:text-green-400">
                          Sign up sucessful! Redirecting in 3 seconds to sign
                          in...
                        </p>
                      </>
                    ) : null}
                  </form>
                </>
              ) : (
                <>
                  <h1 className="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white">
                    Create an account
                  </h1>
                  <form
                    className="space-y-4 md:space-y-6"
                    onSubmit={handleSignUpSubmit}
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Your email
                      </label>
                      <input
                        type="email"
                        name="email"
                        id="email"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder="name@company.com"
                        value={signUpFormData.email}
                        onChange={handleSignUpFormChange}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="password"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Password
                      </label>
                      <input
                        type="password"
                        name="password"
                        id="password"
                        placeholder="••••••••"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={signUpFormData.password}
                        onChange={handleSignUpFormChange}
                        required
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                      >
                        Confirm password
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        id="confirmPassword"
                        placeholder="••••••••"
                        className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        value={signUpFormData.confirmPassword}
                        onChange={handleSignUpFormChange}
                        required
                      />
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="terms"
                          aria-describedby="terms"
                          type="checkbox"
                          className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800"
                          required
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor="terms"
                          className="font-light text-gray-500 dark:text-gray-300"
                        >
                          I accept the{" "}
                          <a
                            className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                            href="#"
                          >
                            Terms and Conditions
                          </a>
                        </label>
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
                    >
                      Create an account
                    </button>
                    <p className="text-sm font-light text-gray-500 dark:text-gray-400">
                      Already have an account?{" "}
                      <a
                        href="/signin/"
                        className="font-medium text-primary-600 hover:underline dark:text-primary-500"
                      >
                        Sign in here
                      </a>
                    </p>
                    {signUpFormError ? (
                      <>
                        <p className="text-sm font-bold text-red-600 dark:text-red-400">
                          {`* ${signUpFormError}`}
                        </p>
                      </>
                    ) : null}
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Signup />
  </StrictMode>
);
