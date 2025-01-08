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
  const [signUpFormError, setSignUpFormError] = useState<null | string>(null);

  const [verifyFormData, setVerifyFormData] = useState<string>("");
  const [verifyFormError, setVerifyFormError] = useState<null | string>(null);
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
      setSignUpFormError(e as string);
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
      setVerifyFormError(e as string);
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
                          data-modal-target="default-modal"
                          data-modal-toggle="default-modal"
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

                      <div
                        id="default-modal"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full"
                      >
                        <div className="relative p-4 w-full max-w-2xl max-h-full">
                          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
                            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
                              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Terms of Service
                              </h3>
                              <button
                                type="button"
                                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                                data-modal-hide="default-modal"
                              >
                                <svg
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 14 14"
                                >
                                  <path
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                                  />
                                </svg>
                                <span className="sr-only">Close modal</span>
                              </button>
                            </div>
                            <div className="p-4 md:p-5 space-y-4">
                              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                                By signing up for an account on MC3
                                GRC, you acknowledge and agree that any
                                company data you provide will be used solely for
                                the purpose of assessing your organization's
                                cybersecurity adherence. Our platform utilizes
                                publicly available OSINT data, such as DNS
                                records, server IPs, and email addresses, to
                                enhance your cybersecurity awareness. We do not
                                access, store, or process any private or
                                non-publicly available information beyond what
                                is voluntarily submitted through our forms.
                              </p>
                              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                                MC3 Technologies is committed to protecting your
                                privacy. All data collected remains strictly
                                internal and is never shared, sold, or
                                distributed to third parties. Your information
                                is used exclusively for cybersecurity assessment
                                and improvement, ensuring that our findings
                                contribute to your organization's security
                                posture. Additionally, you have full control
                                over your account, with the option to delete or
                                terminate it at any time.
                              </p>
                            </div>
                          </div>
                        </div>
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
