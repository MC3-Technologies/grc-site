import { useEffect, useState } from "react";
import DarkModeToggle from "./DarkModeToggle";
import {
  getCurrentUser,
  signOutCurrentUser,
  User,
  ListenData,
  isCurrentUserAdmin,
} from "../amplify/auth";
import { initFlowbite } from "flowbite";
import { Hub } from "aws-amplify/utils";
import { getAmplify } from "../amplify/amplify";
import Spinner from "./Spinner";

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authEvents, setAuthEvents] = useState<ListenData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isUserAdmin, setIsUserAdmin] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    setIsUserAdmin(false);
    getAmplify();
    const hubListener = Hub.listen("auth", (data: ListenData) => {
      setAuthEvents(data);
    });

    const checkUserAdmin = async () => {
      try {
        const isAdmin: boolean = await isCurrentUserAdmin();
        setIsUserAdmin(isAdmin);
      } catch (error) {
        console.error("Error checking if user is admin:", error);
        setIsUserAdmin(false);
      }
    };

    const checkUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user);
        checkUserAdmin();
      } catch (error) {
        console.error("Error checking user session:", error);
        setCurrentUser(null);
      }
    };

    checkUser();
    
    // Initialize Flowbite after a small delay to ensure DOM is ready
    setTimeout(() => {
      initFlowbite();
      setLoading(false);
    }, 100);

    return () => {
      hubListener();
    };
  }, [authEvents]);

  return (
    <nav className="bg-white border-gray-200 dark:bg-gray-950 fixed z-20 top-0 start-0 w-full">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <a href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <img src="/logo-transparent.png" className="h-12" alt="MC3 Logo" />
          <span className="self-center text-xl font-semibold whitespace-nowrap dark:text-white hidden lg:block">
            MC3 GRC
          </span>
        </a>
        <div className="flex items-center md:order-2 space-x-1 md:space-x-0 rtl:space-x-reverse">
          {loading ? (
            <Spinner />
          ) : currentUser ? (
            <div className="relative">
              <button
                type="button"
                className="inline-flex items-center font-medium justify-center px-4 py-2 text-sm text-gray-900 dark:text-white rounded-lg cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-700 dark:hover:text-white"
                id="user-menu-button"
                aria-expanded="false"
                data-dropdown-toggle="user-dropdown"
                data-dropdown-placement="bottom"
                data-dropdown-trigger="click"
              >
                <svg
                  className="w-6 h-6 text-gray-800 dark:text-white"
                  aria-hidden="true"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 20a7.966 7.966 0 0 1-5.002-1.756v-.683c0-1.794 1.492-3.25 3.333-3.25h3.334c1.84 0 3.333 1.456 3.333 3.25v.683A7.966 7.966 0 0 1 12 20ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10c0 5.5-4.44 9.963-9.932 10h-.138C6.438 21.962 2 17.5 2 12Zm10-5c-1.84 0-3.333 1.455-3.333 3.25S10.159 13.5 12 13.5c1.84 0 3.333-1.455 3.333-3.25S13.841 7 12 7Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <div
                className="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
                id="user-dropdown"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex={-1}
              >
                <div className="px-4 py-3">
                  <span className="block text-sm text-gray-900 dark:text-white">
                    {currentUser.email}
                  </span>
                </div>
                <ul className="py-2">
                  {isUserAdmin && (
                    <>
                      <li>
                        <a
                          href="/admin/"
                          className="block px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                        >
                          Admin Dashboard
                        </a>
                      </li>
                    </>
                  )}
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    >
                      My Account
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="block px-4 py-1 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    >
                      My Assessments
                    </a>
                  </li>
                  <li>
                    <button
                      className="block w-full px-4 py-1 text-left text-sm text-red-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-red-200"
                      onClick={signOutCurrentUser}
                    >
                      Sign out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <a
              href="/signin/"
              className="inline-flex items-center font-medium justify-center px-4 py-2 text-sm text-gray-900 dark:text-white rounded-lg cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-700 dark:hover:text-white"
            >
              <svg
                className="w-6 h-6 mr-2 text-gray-800 dark:text-white"
                aria-hidden="true"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M12 20a7.966 7.966 0 0 1-5.002-1.756v-.683c0-1.794 1.492-3.25 3.333-3.25h3.334c1.84 0 3.333 1.456 3.333 3.25v.683A7.966 7.966 0 0 1 12 20ZM2 12C2 6.477 6.477 2 12 2s10 4.477 10 10c0 5.5-4.44 9.963-9.932 10h-.138C6.438 21.962 2 17.5 2 12Zm10-5c-1.84 0-3.333 1.455-3.333 3.25S10.159 13.5 12 13.5c1.84 0 3.333-1.455 3.333-3.25S13.841 7 12 7Z"
                  clipRule="evenodd"
                />
              </svg>
              Sign in
            </a>
          )}
          <DarkModeToggle />
          <button
            data-collapse-toggle="navbar-language"
            type="button"
            className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-primary-700 dark:focus:ring-gray-600"
            aria-controls="navbar-language"
            aria-expanded="false"
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="w-5 h-5"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 17 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M1 1h15M1 7h15M1 13h15"
              />
            </svg>
          </button>
        </div>
        <div
          className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
          id="navbar-language"
        >
          <ul className="flex flex-col font-medium p-4 md:p-0 mt-4 border border-gray-100 rounded-lg bg-gray-50 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-white dark:bg-gray-950 md:dark:bg-gray-950 dark:border-gray-700">
            <li>
              <a
                href="/"
                className="block py-2 px-3 md:p-0 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary-700 dark:text-white md:dark:hover:text-primary-500 dark:hover:bg-primary-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
              >
                Home
              </a>
            </li>
            <li>
              <button
                id="dropdownNavbarLink"
                data-dropdown-toggle="dropdownNavbar"
                className="flex items-center justify-between w-full py-2 px-3 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:border-0 md:hover:text-primary-700 md:p-0 md:w-auto dark:text-white md:dark:hover:text-primary-500 dark:focus:text-white dark:border-primary-700 dark:hover:bg-primary-700 md:dark:hover:bg-transparent"
              >
                Resources{" "}
                <svg
                  className="w-2.5 h-2.5 ms-2.5"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 10 6"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="m1 1 4 4 4-4"
                  />
                </svg>
              </button>
              {/* Dropdown menu */}
              <div
                id="dropdownNavbar"
                className="z-10 hidden font-normal bg-white divide-y divide-gray-100 rounded-lg shadow w-44 dark:bg-gray-700 dark:divide-gray-600"
              >
                <ul
                  className="py-2 text-sm text-gray-700 dark:text-gray-400"
                  aria-labelledby="dropdownLargeButton"
                >
                  <li>
                    <a
                      href="/resources/?resource=it-security"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    >
                      IT Security
                    </a>
                  </li>
                  <li>
                    <a
                      href="/resources/?resource=hipaa-security"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    >
                      HIPAA Security
                    </a>
                  </li>
                  <li>
                    <a
                      href="/resources/?resource=pci-dss-security"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
                    >
                      PCI DSS Security
                    </a>
                  </li>
                </ul>
              </div>
            </li>

            <li>
              <a
                href="/assessments/"
                className="block py-2 px-3 md:p-0 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary-700 dark:text-white md:dark:hover:text-primary-500 dark:hover:bg-primary-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
              >
                CMMC Assessment
              </a>
            </li>
            <li>
              <a
                href="/osint/"
                className="block py-2 px-3 md:p-0 text-gray-900 rounded hover:bg-gray-100 md:hover:bg-transparent md:hover:text-primary-700 dark:text-white md:dark:hover:text-primary-500 dark:hover:bg-primary-700 dark:hover:text-white md:dark:hover:bg-transparent dark:border-gray-700"
              >
                OSINT Scan
              </a>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
