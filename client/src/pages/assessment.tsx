import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";

import "../index.css";
import "survey-core/defaultV2.min.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import { Model } from "survey-core";
import { CompletedAssessment, InProgressAssessment } from "../utils/assessment";
import { surveyJson } from "../assessmentQuestions";
import { Survey } from "survey-react-ui";
import Spinner from "../components/Spinner";
import { BorderlessDark, BorderlessLight } from "survey-core/themes";
import { redirectToAssessments } from "../utils/routing";

type PageData = {
  assessment: Model | null;
  error: string | null;
};

export function Assessment() {
  // Page data state
  const [pageData, setPageData] = useState<PageData>({
    assessment: null,
    error: null,
  });

  // Page ready or not
  const [loading, setLoading] = useState<boolean>(true);

  // Whether assessment is being saved right now state
  const [saving, setSaving] = useState<boolean>(false);

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
  });

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

      // Create local assessment id to use later
      const currentAssessmentId = assessmentIdParam;

      try {
        // Grab assessment data from database
        const assessmentEntryData =
          await InProgressAssessment.fetchAssessmentData(assessmentIdParam);

        // Grab assessment storage json
        const assessmentJsonData =
          await InProgressAssessment.fetchAssessmentStorageData(
            assessmentIdParam
          );

        // Create assessment and give assessment data and current page
        const assessment = new Model(surveyJson);
        assessment.data = JSON.parse(assessmentJsonData as string);
        assessment.currentPageNo = assessmentEntryData.currentPage;

        // Save handler function
        assessment.onValueChanged.add(async (updatedAssessment) => {
          // Error out if assessment id doesnt exist
          if (!currentAssessmentId) {
            console.error("Cannot save assessment, no assessment ID found!");
            return;
          }
          setSaving((prevSaving) => {
            // If save in progress, just return
            if (prevSaving) {
              console.info("Assessment saving already in progress!");
              return prevSaving;
            }

            // If no save in progress, start save progress
            console.info("Saving assessment");
            // Turn assessment data into blob and then file to upload
            const jsonString = JSON.stringify(
              updatedAssessment.getData(),
              null,
              2
            );
            const blob = new Blob([jsonString], { type: "application/json" });
            const file = new File([blob], `${currentAssessmentId}.json`, {
              type: "application/json",
            });

            // Call update/save function
            (async () => {
              try {
                await InProgressAssessment.updateAssessment(
                  currentAssessmentId,
                  updatedAssessment.currentPageNo,
                  updatedAssessment.progressValue,
                  file
                );
                console.info("Successfully saved assessment!");
              } catch (err) {
                console.error(`Error saving assessment: ${err}`);
              } finally {
                setSaving(false);
              }
            })();

            // Return true for stale state prevent
            return true;
          });
        });

        // Add on complete handler
        assessment.onComplete.add(async (assessment) => {
          // Create file to upload from assessment data
          const jsonString = JSON.stringify(assessment.data, null, 2);
          const blob = new Blob([jsonString], { type: "application/json" });
          const file = new File([blob], `${currentAssessmentId}.json`, {
            type: "application/json",
          });
          // Call complete in progress asssessment methgod
          await CompletedAssessment.completeInProgressAssessment(
            file,
            currentAssessmentId
          ).catch((err) => {
            throw new Error(
              `Error moving creating completed assessment : ${err}`
            );
          });
          console.log("Successfully completed assessment");
          // Redirect back to assessments page
          redirectToAssessments();
        });

        setPageData((prev) => ({ ...prev, assessment }));
      } catch (e) {
        setPageData((prev) => ({
          ...prev,
          error: `Error getting assessment from assessment ID: ${e}`,
        }));
      }
    };

    initialize().then(() => setLoading(false));
  }, []);

  // Get page data -> show assessment if assessment fetch success, if not show error to user
  const getPageData = (): JSX.Element => {
    // If error fetching assessment
    if (pageData.error) {
      return <p>{`Error getting assessment! : ${pageData.error}`}</p>;
    }
    // If fetching assessment successful
    if (pageData.assessment) {
      return (
        <>
          <div>
            <div className="mb-6 flex justify-between items-center">
              <a
                href={`/assessments/`}
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
              </a>
              {saving && (
                <span className="text-gray-500 dark:text-gray-400 flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Autosaving...
                </span>
              )}
            </div>

            <Survey model={pageData.assessment} />
          </div>
        </>
      );
    }
    // If no conditions above met, it means fetching of any assessment never startedf
    return (
      <p>{`Error getting assessment, fetching operation never started!`}</p>
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
          <div className="container mx-auto">{getPageData()}</div>
        )}
      </section>
      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Assessment />
  </StrictMode>
);
