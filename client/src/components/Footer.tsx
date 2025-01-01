import { useEffect } from "react";
import { initFlowbite } from "flowbite";

const Footer = () => {
  useEffect(() => {
    initFlowbite();
  }, []);

  return (
    <>
      <hr className="w-6/12 mx-auto h-px  bg-gray-200 border-0 dark:hidden"></hr>
      <footer className="w-full py-3  dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-lg flex items-center justify-center flex-col gap-3 md:flex-row md:gap-10 transition-all duration-500  mb-1 py-2 ">
              <div className="flex items-center text-gray-500 dark:text-white">
                <svg
                  className="w-5 h-5 "
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>

                <a className="mx-1 text-base hover:underline" href="/faq/">
                  FAQ
                </a>
              </div>

              <div className="flex items-center text-gray-500 dark:text-white">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="15"
                  height="15"
                  fill="currentColor"
                  className="bi bi-github"
                  viewBox="0 0 16 16"
                >
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
                </svg>
                <a
                  className="mx-1 text-base hover:underline"
                  target="_blank"
                  href="https://github.com/mc3-technologies"
                >
                  MC3 GitHub
                </a>
              </div>
            </div>

            <span className="text-sm text-gray-500 text-center block dark:text-white">
              ©
              <a href="https://mc3technologies.org" target="_blank">
                MC3 Technologies
              </a>{" "}
              2025, All rights reserved.
            </span>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
