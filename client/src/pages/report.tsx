import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect, useState, useRef } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";

import { fetchAssessmentDataWithCache, ReportResult } from "../utils/report";
import { Report as Rpt } from "../utils/report";
import { redirectToAssessments } from "../utils/routing";

import { useReactToPrint } from "react-to-print";

type PageData = {
  assessmentReportData: ReportResult | null;
  error: string | null;
};

export function Report() {
  // Page data state
  const [pageData, setPageData] = useState<PageData>({
    assessmentReportData: null,
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

        // New report instance
        const report = new Rpt(
          JSON.parse(assessmentJsonData as string) as Record<
            string,
            string | number
          >
        );

        // Call report generation method
        const reportData = report.generateReportData();

        // Set page state
        setPageData((prev) => ({
          ...prev,
          assessmentData: assessmentJsonData as Record<string, string>,
          assessmentReportData: reportData,
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

  // Helper function that takes in abbreviated control group name to return full control group name
  const getControlGroupName = (
    abbreviatedControlGroupName: string
  ): string | null => {
    switch (abbreviatedControlGroupName) {
      case "AC":
        return "Access Control";
      case "IA":
        return "Identification & Authentication";
      case "MP":
        return "Media Protection";
      case "PE":
        return "Physical Protection";
      case "SC":
        return "System & Communications Protection";
      case "SI":
        return "System & Information Integrity";
      default:
        return null;
    }
  };

  // Control compliance status helper function, returns a badge component that indicates control compliance
  const getControlComplianceStatusComponent = (
    score: number,
    maxScore: number
  ): JSX.Element => {
    if (score === maxScore) {
      return (
        <p className="font-bold text-green-600 dark:text-green-400">
          {" "}
          Implemented{" "}
        </p>
      );
    } else if (score > 0 && score < maxScore) {
      return (
        <p className="font-bold text-yellow-600 dark:text-yellow-400">
          {" "}
          Partially Implemented{" "}
        </p>
      );
    } else {
      return (
        <p className="font-bold text-red-600 dark:text-red-400">
          {" "}
          Not Implemented{" "}
        </p>
      );
    }
  };

  const isControlCompliant = (score: number, maxScore: number): boolean => {
    return !(score >= 0 && score < maxScore);
  };

  const getReportUi = (assessmentReportData: ReportResult): JSX.Element => {
    return (
      <>
        {/* Assessment onboarding data section */}
        <div className="grid grid-cols-1 gap-5">
          <div className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
            <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Organization Onboarding
            </h5>
            <p className="font-normal mb-4 text-gray-700 dark:text-gray-400">
              This table details your organization's onboarding information.
            </p>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      Question
                    </th>

                    <th
                      scope="col"
                      className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      Answer
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {assessmentReportData.onboardingResults.map((val, key) => (
                    <tr className="bg-white dark:bg-gray-800" key={key}>
                      <td scope="row" className="px-3 pt-2">
                        {val.question}
                      </td>

                      <th className="px-6 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                        {val.answer}
                      </th>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* List of controls and adherence table data section */}
        <div className="grid grid-cols-1 gap-5 my-4">
          <div className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
            <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Detailed Report
            </h5>
            <p className="font-normal mb-4 text-gray-700 dark:text-gray-400">
              This table details your organization's compliance status with the
              specific controls of CMMC level 1. This status is based on
              information provided by you about your organization from your
              assessment.
            </p>
            {/* Assessment scoring and adherence percentage section */}
            <div className="grid grid-cols-2 gap-3  md:mx-0 mx-2 pb-5">
              <div className="block  p-4 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  Assessment Score
                </p>
                <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {assessmentReportData.score} / {assessmentReportData.maxScore}
                </h5>
              </div>
              <div className="block  p-4 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
                <p className="font-normal text-gray-700 dark:text-gray-400">
                  % Adherent
                </p>
                <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {Math.round(
                    (assessmentReportData.score /
                      assessmentReportData.maxScore) *
                      100
                  )}
                  %
                </h5>
              </div>
            </div>

            {/* List of controls and adherence table data */}
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      Control Group
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      Control
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      Control Score
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      Control Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...assessmentReportData.controlGroupResults.entries()].map(
                    ([groupKey, groupVal]) => (
                      <>
                        {[...groupVal.controlResults.entries()].map(
                          ([controlKey, controlVal]) => (
                            <>
                              <tr
                                className="bg-white dark:bg-gray-800"
                                key={controlKey}
                              >
                                <th
                                  scope="row"
                                  className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                  {getControlGroupName(groupKey)} ({groupKey})
                                </th>
                                <th
                                  scope="row"
                                  className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                  {controlKey}
                                </th>
                                <th
                                  scope="row"
                                  className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                                >
                                  {controlVal.score} / {controlVal.maxScore}
                                </th>
                                <td className="px-6 pt-3 font-semibold text-base">
                                  {getControlComplianceStatusComponent(
                                    controlVal.score,
                                    controlVal.maxScore
                                  )}
                                </td>
                              </tr>

                              {controlVal.questionsAnswered.map((qa, idx) => (
                                <>
                                  <tr key={idx}>
                                    <td colSpan={3} key={idx} className="px-3">
                                      <p>
                                        {controlKey}.{idx + 1}: {qa.question}
                                      </p>
                                    </td>
                                    <td colSpan={1} key={idx} className="px-6 ">
                                      <p>{qa.answer}</p>
                                    </td>
                                  </tr>
                                  {qa.followUp && (
                                    <>
                                      <tr key={idx}>
                                        <td
                                          colSpan={3}
                                          key={idx}
                                          className="px-3"
                                        >
                                          <p>
                                            {controlKey}.{idx + 1} Follow up:{" "}
                                            {qa.followUp.question}
                                          </p>
                                        </td>
                                        <td
                                          colSpan={1}
                                          key={idx}
                                          className="px-6 "
                                        >
                                          <p>{qa.followUp.answer}</p>
                                        </td>
                                      </tr>
                                    </>
                                  )}
                                </>
                              ))}
                            </>
                          )
                        )}
                      </>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* List of non adherent controls */}
        {assessmentReportData.score !== assessmentReportData.maxScore && (
          <div className="grid grid-cols-1 gap-5 my-4">
            <div className="block w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm  dark:bg-gray-800 dark:border-gray-700 ">
              <h5 className=" text-2xl font-bold tracking-tight text-gray-900 dark:text-white mb-1">
                Control Action Items
              </h5>
              <p className="font-normal mb-1 text-gray-700 dark:text-gray-400">
                This table details your organization's focus areas to become
                fully adherent to CMMC level 1.
              </p>

              <p className="font-large mb-4 text-gray-700 dark:text-gray-400 font-bold">
                Click{" "}
                <a
                  target="_blank"
                  href="/security-models/?model=cmmclevel1"
                  className="text-blue-600 dark:text-blue-400 hover:underline"
                >
                  here
                </a>{" "}
                to view how to implement CMMC controls.
              </p>
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th
                        scope="col"
                        className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                      >
                        Control Group
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                      >
                        Control
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                      >
                        Control Score
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white"
                      >
                        Control Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...assessmentReportData.controlGroupResults.entries(),
                    ].map(([groupKey, groupVal]) => (
                      <>
                        {[...groupVal.controlResults.entries()].map(
                          ([controlKey, controlVal]) => (
                            <>
                              {!isControlCompliant(
                                controlVal.score,
                                controlVal.maxScore
                              ) && (
                                <>
                                  <tr
                                    className="bg-white dark:bg-gray-800"
                                    key={controlKey}
                                  >
                                    <th
                                      scope="row"
                                      className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                                    >
                                      {getControlGroupName(groupKey)} (
                                      {groupKey})
                                    </th>
                                    <th
                                      scope="row"
                                      className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                                    >
                                      {controlKey}
                                    </th>

                                    <th
                                      scope="row"
                                      className="px-3 pt-3 font-semibold text-base text-gray-900 whitespace-nowrap dark:text-white"
                                    >
                                      {controlVal.score} / {controlVal.maxScore}
                                    </th>
                                    <td className="px-6 pt-3 font-semibold text-base">
                                      {getControlComplianceStatusComponent(
                                        controlVal.score,
                                        controlVal.maxScore
                                      )}
                                    </td>
                                  </tr>

                                  {controlVal.questionsAnswered.map(
                                    (qa, idx) => (
                                      <>
                                        <tr key={idx}>
                                          <td
                                            colSpan={3}
                                            key={idx}
                                            className="px-3"
                                          >
                                            <p>
                                              {controlKey}.{idx + 1}:{" "}
                                              {qa.question}
                                            </p>
                                          </td>
                                          <td
                                            colSpan={1}
                                            key={idx}
                                            className="px-6 "
                                          >
                                            <p>{qa.answer}</p>
                                          </td>
                                        </tr>
                                        {qa.followUp && (
                                          <>
                                            <tr key={idx}>
                                              <td
                                                colSpan={3}
                                                key={idx}
                                                className="px-3"
                                              >
                                                <p>
                                                  {controlKey}.{idx + 1} Follow
                                                  up: {qa.followUp.question}
                                                </p>
                                              </td>
                                              <td
                                                colSpan={1}
                                                key={idx}
                                                className="px-6 "
                                              >
                                                <p>{qa.followUp.answer}</p>
                                              </td>
                                            </tr>
                                          </>
                                        )}
                                      </>
                                    )
                                  )}
                                </>
                              )}
                            </>
                          )
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </>
    );
  };

  // Get page data -> show assessment if assessment fetch success, if not show error to user
  const getPageData = (): JSX.Element => {
    // If error fetching assessment
    if (pageData.error) {
      return errorFeedback(
        `There was an error fetching your completed assessment : ${pageData.error}`
      );
    }
    // If fetching assessment successful
    if (pageData.assessmentReportData) {
      const { assessmentReportData } = pageData;

      return getReportUi(assessmentReportData);
    }
    // If no conditions above met, it means fetching of any assessment never started
    return errorFeedback(
      "Error getting assessment, fetching operation never started!"
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
  </StrictMode>
);
