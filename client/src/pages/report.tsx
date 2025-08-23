import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect, useState, useRef } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";

import { fetchAssessmentDataWithCache } from "../utils/localStorage";
import { redirectToAssessments } from "../utils/routing";

import { useReactToPrint } from "react-to-print";
import { AssessmentStorageData } from "../lib/assessment";
import reports from "../lib/report";

type PageData = {
  assessmentStorageData: AssessmentStorageData | null;
  error: string | null;
};

export function Report() {
  // Page data state
  const [pageData, setPageData] = useState<PageData>({
    assessmentStorageData: null,
    error: null,
  });

  // Page ready or not
  const [loading, setLoading] = useState<boolean>(true);

  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({ contentRef });

  useEffect(() => {
    initFlowbite();
    // Initialization function
    const initialize = async (): Promise<void> => {
      // Grab assessment id from parameter
      const params = new URLSearchParams(window.location.search);
      const assessmentIdParam = params.get("assessment-id");

      // If no assessment id url param, set error state
      if (!assessmentIdParam) {
        setPageData((prev) => ({ ...prev, error: "No assessment ID found!" }));
        return;
      }

      try {
        // In order to grab assessment data the following happens
        // 1. Check cache for the data and if its there, grab it and use it
        // 2. If cache miss, fetch data from storage and use it for report class instance then set it in cache to use later
        // Function to handle the above
        const assessmentJsonData =
          await fetchAssessmentDataWithCache(assessmentIdParam);

        if (!reports.has(assessmentJsonData.questionnaireVersion)) {
          setPageData((prev) => ({
            ...prev,
            error: "Assessment version does not have a report function!",
          }));
          return;
        }
        // Set page state
        setPageData((prev) => ({
          ...prev,
          assessmentStorageData: assessmentJsonData,
        }));
      } catch (e) {
        setPageData((prev) => ({
          ...prev,
          error: `Error getting assessment from assessment ID: ${e}`,
        }));
      }
    };

    initialize().finally(() => setLoading(false));
  }, []);

  // Add redirection effect when there's an error
  useEffect(() => {
    if (pageData.error) {
      const timer = setTimeout(() => {
        window.location.href = "/assessments/";
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [pageData.error]);

  // errorFeedback function to show error feedback and redirect after 5 seconds
  const errorFeedback = (message: string): React.JSX.Element => {
    return (
      <>
        <section className="bg-white dark:bg-gray-900">
          <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
            <div className="mx-auto max-w-screen-sm text-center">
              <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary-600 dark:text-primary-500">
                Error
              </h1>
              <p className="mb-4 text-3xl tracking-tight font-bold text-gray-900 md:text-4xl dark:text-white">
                Something went wrong.
              </p>
              <p className="mb-4 text-lg font-light text-gray-500 dark:text-gray-400">
                There was an error fetching your assessment : {`${message}`}
              </p>
              <p className="mb-4 text-lg text-gray-500 dark:text-gray-400 font-bold">
                Redirecting you back to the assessments page in 5 seconds.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  };

  // Get page data -> show assessment if assessment fetch success, if not show error to user
  const getPageData = (): JSX.Element => {
    // If error fetching assessment
    if (pageData.error) {
      return errorFeedback(
        `There was an error fetching your completed assessment : ${pageData.error}`,
      );
    }
    // If fetching assessment successful
    console.log(pageData.assessmentStorageData);
    if (pageData.assessmentStorageData) {
      const report = reports.get(
        pageData.assessmentStorageData.questionnaireVersion,
      )!;
      const reportResults = report.getReportData(
        pageData.assessmentStorageData.data,
      );
      return report.displayReport(reportResults);
    }
    // If no conditions above met, it means fetching of any assessment never started
    return errorFeedback(
      "Error getting assessment, fetching operation never started!",
    );
  };

  return (
    <>
      <Navbar />

      <section className="mt-20 bg-white dark:bg-gray-900">
        <div className="py-4 md:px-4 mx-auto max-w-screen-xl text-center ">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <div className="container mx-auto  md:px-0 px-2">
              {/* Button to go back to assessments */}
              <button
                onClick={() => redirectToAssessments()}
                className="flex items-center text-primary-600 hover:text-primary-800 transition-colors pb-4"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  ></path>
                </svg>
                Back to Assessments
              </button>

              {/* Print report button section */}
              {!pageData.error && (
                <button
                  onClick={() => reactToPrintFn()}
                  type="button"
                  className="inline-flex items-center justify-center focus:outline-none text-white bg-primary-500  hover:bg-primary-800 focus:ring-4 font-semibold rounded-lg text-md  py-2.5 mb-4 dark:bg-primary-600 dark:hover:bg-primary-700  w-full"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                      d="M12 13V4M7 14H5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1h-2m-1-5-4 5-4-5m9 8h.01"
                    />
                  </svg>
                  Print Report
                </button>
              )}

              {/* Report section div */}
              <div ref={contentRef}>{getPageData()}</div>
            </div>
          )}
        </div>
      </section>
      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Report />
  </StrictMode>,
);
