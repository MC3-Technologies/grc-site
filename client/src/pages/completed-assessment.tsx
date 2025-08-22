import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";

import "../index.css";
import "survey-core/defaultV2.min.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import { Model } from "survey-core";
import { CompletedAssessment } from "../utils/assessment";
// import { getLatestQuestionnaireData } from "../utils/questionnaireUtils";
import { Survey } from "survey-react-ui";
import Spinner from "../components/Spinner";
import { BorderlessDark, BorderlessLight } from "survey-core/themes";
import { redirectToAssessments } from "../utils/routing";
import { fetchUsers } from "../utils/adminUser";

type PageData = {
  assessment: Model | null;
  assessmentData: {
    id: string;
    name: string;
    completedAt: string;
    complianceScore: number;
    isCompliant: boolean;
    storagePath: string;
    version: string;
    owner: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
  } | null;
  error: string | null;
};

// Helper function to format dates
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Helper function to calculate duration between two dates
// const calculateDuration = (startDate: string, endDate: string): string => {
//   const start = new Date(startDate);
//   const end = new Date(endDate);
//   const durationMs = end.getTime() - start.getTime();

//   const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
//   const hours = Math.floor(
//     (durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
//   );

//   if (days > 0) {
//     return `${days}d ${hours}h`;
//   } else {
//     return `${hours}h`;
//   }
// };

export function CompletedAssessmentView() {
  // Page data state
  const [pageData, setPageData] = useState<PageData>({
    assessment: null,
    assessmentData: null,
    error: null,
  });

  // Page ready or not
  const [loading, setLoading] = useState<boolean>(true);

  // Add user map state for ID to email mapping
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  useEffect(() => {
    initFlowbite();

    if (pageData.assessment !== null) {
      const assessment = pageData.assessment;

      // Set dark theme to use MC3 site theme colors
      BorderlessDark.cssVariables = {
        ...BorderlessDark.cssVariables,
        "--sjs-primary-backcolor": "#a05243",
      };

      // Set light theme to use MC3 site theme colors
      BorderlessLight.cssVariables = {
        ...BorderlessLight.cssVariables,
        "--sjs-primary-backcolor": "#a05243",
      };

      // Check if dark mode is stored in local storage
      const storedDarkMode = localStorage.getItem("darkMode") === "true";
      if (storedDarkMode) {
        assessment.applyTheme(BorderlessDark);
      } else {
        assessment.applyTheme(BorderlessLight);
      }

      // Add handlers to events
      const handleDarkMode = () => assessment.applyTheme(BorderlessDark);
      const handleLightMode = () => assessment.applyTheme(BorderlessLight);
      window.addEventListener("darkMode", handleDarkMode);
      window.addEventListener("lightMode", handleLightMode);

      return () => {
        window.removeEventListener("darkMode", handleDarkMode);
        window.removeEventListener("lightMode", handleLightMode);
      };
    }
  }, [pageData.assessment]);

  useEffect(() => {
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
        // Grab completed assessment data from database
        const assessmentEntryData =
          await CompletedAssessment.fetchAssessmentData(assessmentIdParam);

        // Grab assessment storage json
        const assessmentJsonData =
          await CompletedAssessment.fetchAssessmentStorageData(
            assessmentIdParam,
          );

        // Questionnaire ssurvery data versioning disabled for now  -- 5/27/25

        // Use the questionnaire stored with the assessment if available
        // Otherwise fall back to the latest questionnaire data (for backward compatibility)
        // let questionnaireData;
        // if (parsedAssessmentData && parsedAssessmentData.questionnaire) {
        //   //console.log("Using questionnaire stored with assessment");
        //   questionnaireData = parsedAssessmentData.questionnaire;
        // } else {
        //   //console.log("Using latest questionnaire (compatibility mode)");
        //   questionnaireData = await getLatestQuestionnaireData();
        // }

        // Create assessment survey model with the data
        // const questionnaireData = await getLatestQuestionnaireData();
        // const assessment = new Model(questionnaireData);
        const assessment = new Model(assessmentJsonData.questionnaire);
        // assessment.data = parsedAssessmentData.data || parsedAssessmentData;
        assessment.data = assessmentJsonData.data;

        // Set survey to display mode (read-only)
        assessment.mode = "display";

        setPageData((prev) => ({
          ...prev,
          assessment,
          assessmentData: assessmentEntryData,
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

  // Add a useEffect to load user email mapping
  useEffect(() => {
    const loadUserMap = async () => {
      try {
        // Force refresh to ensure we get latest user data
        const users = await fetchUsers(true);
        const userMapping: Record<string, string> = {};

        users.forEach((user) => {
          // The ID can be in user.attributes.sub or user.email (which is actually the UUID)
          const userId = user.attributes?.sub || user.email;
          // The actual email is in user.attributes.email or user.email if it's already an email
          const userEmail =
            user.attributes?.email ||
            (user.email.includes("@") ? user.email : null);

          if (userId && userEmail) {
            userMapping[userId] = userEmail;
            //console.log(`Mapped user ID ${userId} to email ${userEmail}`);
          }
        });

        setUserMap(userMapping);
        //console.log("User ID to email mapping created:", userMapping);
      } catch (error) {
        console.error("Error creating user mapping:", error);
      }
    };

    loadUserMap();
  }, []);

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

  // Add redirection effect when there's an error
  useEffect(() => {
    if (pageData.error) {
      const timer = setTimeout(() => {
        window.location.href = "/assessments/";
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [pageData.error]);

  // Update the owner display in getPageData to use the email mapping
  const getOwnerEmail = (ownerId: string | null): string | null => {
    if (!ownerId) return null;

    // If owner ID is already an email, return it
    if (ownerId.includes("@")) return ownerId;

    // Look up in our mapping
    if (userMap[ownerId]) return userMap[ownerId];

    // If no match, log and return owner ID (better than nothing)
    //console.log(`Could not find email for owner ID: ${ownerId}`);
    return ownerId;
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
    if (pageData.assessment && pageData.assessmentData) {
      const { assessmentData } = pageData;

      return (
        <>
          <div>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={() => redirectToAssessments()}
                  className="flex items-center text-primary-600 hover:text-primary-800 transition-colors"
                >
                  <svg
                    className="w-5 h-5 mr-1"
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {assessmentData.name}
                </h1>
              </div>

              {/* Assessment Summary Card */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm mb-6">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Completed:
                      </span>{" "}
                      {formatDate(assessmentData.completedAt)}
                    </p>
                    {/* <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Duration:
                      </span>{" "}
                      {calculateDuration(
                        assessmentData.createdAt,
                        assessmentData.completedAt,
                      )}
                    </p> */}
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Version:
                      </span>{" "}
                      {assessmentData.version}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Score:
                      </span>{" "}
                      {assessmentData.complianceScore}%
                    </p>
                    {assessmentData.owner && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                        <span className="font-medium text-gray-700 dark:text-gray-300 mr-1">
                          Owner:
                        </span>
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          ></path>
                        </svg>
                        {getOwnerEmail(assessmentData.owner)}
                      </p>
                    )}
                  </div>
                </div>

                {/* Compliance Status */}
                {/* <div
                  className={`flex items-center p-3 rounded-md ${
                    assessmentData.isCompliant
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-full mr-2 ${
                      assessmentData.isCompliant
                        ? "bg-green-500 text-white"
                        : "bg-red-500 text-white"
                    }`}
                  >
                    {assessmentData.isCompliant ? (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        ></path>
                      </svg>
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      assessmentData.isCompliant
                        ? "text-green-800 dark:text-green-200"
                        : "text-red-800 dark:text-red-200"
                    }`}
                  >
                    {assessmentData.isCompliant
                      ? "CMMC Level 1 Compliant"
                      : "Not Compliant with CMMC Level 1"}
                  </span>
                </div> */}
              </div>
            </div>

            {/* Survey Component in Display Mode */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Assessment Details
              </h2>
              <Survey model={pageData.assessment} />
            </div>
          </div>
        </>
      );
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
        {loading ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8">{getPageData()}</div>
        )}
      </section>
      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CompletedAssessmentView />
  </StrictMode>,
);
