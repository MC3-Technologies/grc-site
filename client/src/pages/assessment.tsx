import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";

import "../index.css";
import "survey-core/defaultV2.min.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import { Model } from "survey-core";
import { InProgressAssessment } from "../utils/assessment";
import { surveyJson } from "../assessmentQuestions";
import { Survey } from "survey-react-ui";
import Spinner from "../components/Spinner";
import { BorderlessDark, BorderlessLight } from "survey-core/themes";

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
  const [loading, setLoading] = useState<boolean>(true);

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
      // Get assessment id from url parameters
      const params = new URLSearchParams(window.location.search);
      const assessmentIdParam = params.get("assessment-id") as string | null;

      // If no assessment id found in URL, set error state
      if (!assessmentIdParam || assessmentIdParam === null) {
        setPageData((prev) => ({
          ...prev,
          error: "No assessment ID found!",
        }));
        return;
      }

      // In progress assessment class instance to use for methods
      const inProgressAssessmentInstance = new InProgressAssessment();
      try {
        // Get assessment database entry data -> current page, progress etc
        const assessmentEntryData =
          await inProgressAssessmentInstance.fetchAssessmentData(
            assessmentIdParam
          );

        // Get assessment JSON data from storage
        const assessmentJsonData =
          await inProgressAssessmentInstance.fetchAssessmentStorageData(
            assessmentIdParam
          );

        // Create new assessment instance
        const assessment = new Model(surveyJson);

        // Set assessment progress and current page from fetched database entry
        assessment.data = assessmentJsonData;
        assessment.currentPage = assessmentEntryData.currentPage;

        // Set assessment state if all success above
        setPageData((prev) => ({
          ...prev,
          assessment: assessment,
        }));
      } catch (e) {
        // Set error state if fetching assessment state unsuccessful
        setPageData((prev) => ({
          ...prev,
          error: `Error getting assessment from assessment ID : ${e}`,
        }));
        return;
      }
    };

    // Call initialize function then set loading to false
    initialize().then(() => {
      setLoading(false);
    });
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
