import { StrictMode, useEffect, useState, useRef, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import DOMPurify from "dompurify"; // Import DOMPurify for XSS protection

import "../index.css";
import "survey-core/defaultV2.min.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import { Model } from "survey-core";
import { CompletedAssessment, InProgressAssessment } from "../utils/assessment";
import { getLatestQuestionnaireData } from "../utils/questionnaireUtils";
import { Survey } from "survey-react-ui";
import Spinner from "../components/Spinner";
import { BorderlessDark, BorderlessLight } from "survey-core/themes";
import { redirectToAssessments } from "../utils/routing";
import { Report as Rpt } from "../utils/report";

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
    duration: number;
  } | null;
  error: string | null;
};

/**
 * Helper function to sanitize data before saving
 * Uses DOMPurify to prevent XSS attacks, handling both direct script injection
 * and event handlers like onerror, onclick, etc.
 * Strips ALL HTML elements and attributes for maximum security.
 */
const sanitizeAssessmentData = (data: unknown): unknown => {
  if (!data) return data;

  // For objects, recursively sanitize each property
  if (typeof data === "object" && data !== null) {
    if (Array.isArray(data)) {
      return data.map((item) => sanitizeAssessmentData(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        sanitized[key] = sanitizeAssessmentData(
          (data as Record<string, unknown>)[key],
        );
      }
    }
    return sanitized;
  }

  // For strings, use DOMPurify with maximum restrictions to strip ALL HTML
  if (typeof data === "string") {
    // Completely strip all HTML and attributes for maximum security
    return DOMPurify.sanitize(data, {
      ALLOWED_TAGS: [], // Allow no HTML tags
      ALLOWED_ATTR: [], // Allow no HTML attributes
    });
  }

  // Return unchanged for other data types
  return data;
};

// Helper function to sanitize assessment ID
const sanitizeAssessmentId = (id: string): string => {
  // More robust sanitization that:
  // 1. Removes anything that's not a letter, number, dash, or underscore
  // 2. Replaces all special characters with a single underscore (not just consecutive ones)
  // 3. Removes leading/trailing special characters
  // 4. Ensures ID is valid by checking for content and non-special-char-only
  const sanitized = id
    .replace(/[^a-zA-Z0-9_-]/g, "") // Remove non-alphanumeric chars
    .replace(/[-_]+/g, "_") // Convert all special chars runs into a single "_"
    .replace(/^[-_]|[-_]$/g, ""); // Trim leading/trailing special chars

  // Return default_id if:
  // - sanitized is empty
  // - sanitized is just "_" (from special char normalization)
  // - sanitized has no alphanumeric characters (only special chars)
  return sanitized && sanitized !== "_" && sanitized.match(/[a-zA-Z0-9]/)
    ? sanitized
    : "default_id";
};

// Helper function for safe navigation
const safeNavigate = (path: string): void => {
  // Ensure path starts with a slash, doesn't contain protocol/domain, and isn't the current path
  if (
    path.startsWith("/") &&
    !path.includes("://") &&
    window.location.pathname !== path
  ) {
    window.location.href = path;
  } else {
    console.warn(
      `Ignoring navigation attempt to ${path} (already on this page or unsafe)`,
    );
  }
};

export function Assessment() {
  // Page data state
  const [pageData, setPageData] = useState<PageData>({
    assessment: null,
    assessmentData: null,
    error: null,
  });

  // Page ready or not
  const [loading, setLoading] = useState<boolean>(true);

  // Whether assessment is being saved right now state
  const [saving, setSaving] = useState<boolean>(false);

  // Add state for completion modal
  const [showCompletionModal, setShowCompletionModal] =
    useState<boolean>(false);

  // Add state for error modal
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Refs for modals to handle focus trapping
  const completionModalRef = useRef<HTMLDivElement>(null);
  const errorModalRef = useRef<HTMLDivElement>(null);

  // For redirect after user acknowledges completion
  const handleCompletionConfirm = () => {
    // Use safer navigation approach
    safeNavigate("/assessments/");
  };

  // For dismissing error modal
  const handleErrorDismiss = () => {
    setShowErrorModal(false);
  };

  // Memoized tab key handler for modal focus trapping
  const handleTabKey = useCallback(
    (e: KeyboardEvent, modalRef: React.RefObject<HTMLDivElement>) => {
      if (!modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[
        focusableElements.length - 1
      ] as HTMLElement;

      if (e.key === "Tab") {
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    },
    [],
  );

  // Initialize Flowbite only once
  useEffect(() => {
    initFlowbite();
  }, []);

  // Handle focus management and trapping for modals - consolidated for better performance
  useEffect(() => {
    // Skip effect entirely if no modals are open
    if (!showCompletionModal && !showErrorModal) return;

    // Get the reference to the active modal
    const modalRef = showCompletionModal ? completionModalRef : errorModalRef;
    if (!modalRef?.current) return;

    // Set initial focus on first focusable element
    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    // Create a single event handler for tab key navigation
    const handleTabKeyPress = (e: KeyboardEvent) => handleTabKey(e, modalRef);
    window.addEventListener("keydown", handleTabKeyPress);

    // Clean up event listener
    return () => {
      window.removeEventListener("keydown", handleTabKeyPress);
    };
  }, [showCompletionModal, showErrorModal, handleTabKey]);

  // Add keyboard event listener for accessibility - only when a modal is open
  useEffect(() => {
    // Skip if no modals are open - don't attach unnecessary listeners
    if (!showCompletionModal && !showErrorModal) return;

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Close whichever modal is open
        setShowCompletionModal(false);
        setShowErrorModal(false);
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => {
      window.removeEventListener("keydown", handleEscapeKey);
    };
  }, [showCompletionModal, showErrorModal]);

  // Handle theme changes when assessment is available
  useEffect(() => {
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

      // Get dark mode setting with enhanced security and validation
      const getStoredDarkMode = (): boolean => {
        try {
          // Explicitly force a strict boolean return
          const storedValue = localStorage.getItem("darkMode");
          // Only accept exactly "true" or "false", with explicit fallback
          return storedValue === "true"
            ? true
            : storedValue === "false"
              ? false
              : false;
        } catch (error) {
          console.error("Error accessing localStorage:", error);
          return false; // Default to light mode if localStorage is inaccessible
        }
      };

      // Helper to safely store dark mode preference
      const setStoredDarkMode = (isDark: boolean): void => {
        try {
          // Always store as string "true" or "false" only
          localStorage.setItem("darkMode", isDark ? "true" : "false");
        } catch (error) {
          console.error("Error saving darkMode to localStorage:", error);
        }
      };

      // Safely access localStorage with error handling
      const storedDarkMode = getStoredDarkMode();
      if (storedDarkMode) {
        assessment.applyTheme(BorderlessDark);
        // Re-save the value to ensure it's in the correct format
        setStoredDarkMode(true);
      } else {
        assessment.applyTheme(BorderlessLight);
        // Re-save the value to ensure it's in the correct format
        setStoredDarkMode(false);
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
        setLoading(false); // Make sure to set loading to false to show the error
        return;
      }

      // Create local assessment id to use later
      const currentAssessmentId = sanitizeAssessmentId(assessmentIdParam ?? "");

      // If ID is empty after sanitization or equals default_id, it was invalid
      if (currentAssessmentId === "default_id") {
        setPageData((prev) => ({
          ...prev,
          error: "Invalid assessment ID format!",
        }));
        setLoading(false);
        return;
      }

      try {
        // Grab assessment data from database
        const assessmentEntryData =
          await InProgressAssessment.fetchAssessmentData(assessmentIdParam);

        // Grab assessment storage json
        const assessmentJsonData =
          await InProgressAssessment.fetchAssessmentStorageData(
            assessmentIdParam,
          );

        // Create assessment and give assessment data and current page
        const assessment = new Model(getLatestQuestionnaireData());
        assessment.data = JSON.parse(assessmentJsonData as string);
        assessment.currentPageNo = assessmentEntryData.currentPage;
        assessment.completedHtml = `
        <div style="text-align:center">
          <h2>🎉 Your assessment has been submitted!</h2>
          <p>You will be redirected to the assessments page in 5 seconds where you can view your results. </a>
        </div>`;

        // Setup save debounce timer variable
        let saveTimeout: NodeJS.Timeout | null = null;

        // Save handler function with debounce to prevent excessive saves
        assessment.onValueChanged.add(async (updatedAssessment) => {
          // Error out if assessment id doesnt exist
          if (!currentAssessmentId) {
            console.error("Cannot save assessment, no assessment ID found!");
            return;
          }

          // Clear any existing timeout to implement debounce pattern
          if (saveTimeout) {
            clearTimeout(saveTimeout);
          }

          // Set a new timeout to delay the save operation
          saveTimeout = setTimeout(async () => {
            try {
              setSaving(true);
              console.info("Saving assessment");

              // Turn assessment data into blob and then file to upload
              const jsonString = JSON.stringify(
                sanitizeAssessmentData(updatedAssessment.getData()),
                null,
                2,
              );
              const blob = new Blob([jsonString], { type: "application/json" });
              const file = new File(
                [blob],
                `${sanitizeAssessmentId(currentAssessmentId)}.json`,
                {
                  type: "application/json",
                },
              );

              await InProgressAssessment.updateAssessment(
                currentAssessmentId,
                updatedAssessment.currentPageNo,
                updatedAssessment.progressValue,
                file,
              );

              console.info("Successfully saved assessment!");
            } catch (err) {
              console.error(`Error saving assessment: ${err}`);
            } finally {
              setSaving(false);
            }
          }, 1500); // Delay saving by 1.5 seconds to collect multiple changes
        });

        // Error handling function to avoid repeating code
        const handleCompletionError = (error: unknown): void => {
          console.error(`Error completing assessment: ${error}`);
          setErrorMessage(
            "There was an error completing your assessment. Please try again.",
          );
          setShowErrorModal(true);
          setSaving(false);
        };

        // Success handler function
        const handleCompletionSuccess = (): void => {
          console.info("Assessment completed successfully!");
          // setShowCompletionModal(true);
          setSaving(false);
          setTimeout(() => {
            window.location.href = "/assessments/";
          }, 5000);
        };

        // In the onComplete handler - add reference to CompletedAssessment
        assessment.onComplete.add(async () => {
          // Mark assessment as complete and submit final data
          if (!currentAssessmentId) {
            console.error(
              "Cannot complete assessment, no assessment ID found!",
            );
            return;
          }

          try {
            // Get final assessment data
            const finalAssessmentData = sanitizeAssessmentData(
              assessment.getData(),
            );
            const jsonString = JSON.stringify(finalAssessmentData, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const file = new File(
              [blob],
              `${sanitizeAssessmentId(currentAssessmentId)}.json`,
              {
                type: "application/json",
              },
            );

            // First update with 100% progress
            await InProgressAssessment.updateAssessment(
              currentAssessmentId,
              assessment.currentPageNo,
              100, // Set to 100% complete
              file,
            );

            // Create temporary report isntance to calculate adherence score
            const tempReport = new Rpt(
              finalAssessmentData as Record<string, string | number>,
            );
            const score = Math.round(
              (tempReport.generateReportData().score /
                tempReport.generateReportData().maxScore) *
                100,
            );

            // Now create a completed assessment record and remove from in-progress
            await CompletedAssessment.completeInProgressAssessment(
              file,
              currentAssessmentId,
              score,
            );

            handleCompletionSuccess();
          } catch (err) {
            handleCompletionError(err);
          }
        });

        setPageData((prev) => ({ ...prev, assessment }));
      } catch (e) {
        setPageData((prev) => ({
          ...prev,
          error: `Error getting assessment from assessment ID: ${e}`,
        }));
      }
    };

    initialize().finally(() => {
      setLoading(false);
    });
  }, []);

  // Error component to show if errors
  const errorFeedback = (message: string): React.JSX.Element => {
    // Set up redirect without rendering in JSX
    setTimeout(() => {
      window.location.href = "/assessments/";
    }, 5000);

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
              <p className="mb-4 text-lg  text-gray-500 dark:text-gray-400 font-bold">
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
      return errorFeedback(pageData.error);
    }
    // If fetching assessment successful
    if (pageData.assessment) {
      return (
        <>
          <div>
            <div className="mb-6 flex justify-between items-center">
              <button
                onClick={() => redirectToAssessments()}
                onKeyDown={(e) => e.key === "Enter" && redirectToAssessments()}
                className="flex items-center text-primary-600 hover:text-primary-800 transition-colors"
                tabIndex={0}
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

            {/* Top Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(pageData.assessment.progressValue)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${pageData.assessment.progressValue}%` }}
                ></div>
              </div>
            </div>

            <Survey model={pageData.assessment} />

            {/* Bottom Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Progress
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {Math.round(pageData.assessment.progressValue)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div
                  className="bg-primary-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${pageData.assessment.progressValue}%` }}
                ></div>
              </div>
            </div>
          </div>
        </>
      );
    }
    // If no conditions above met, it means fetching of any assessment never started
    return errorFeedback("Assessment fetching operation never initialized");
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

      {/* Completion Success Modal */}
      {showCompletionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="completion-modal-title"
        >
          <div
            className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 animate-fade-in-down"
            ref={completionModalRef}
          >
            <div className="flex flex-col items-center">
              {/* Success Icon */}
              <div className="inline-flex p-4 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="w-12 h-12 text-green-600 dark:text-green-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3
                id="completion-modal-title"
                className="mb-4 text-xl font-medium text-gray-900 dark:text-white"
              >
                Assessment Completed
              </h3>
              <p className="mb-6 text-base text-center text-gray-500 dark:text-gray-400">
                Your assessment has been submitted successfully.
              </p>
              <button
                type="button"
                onClick={handleCompletionConfirm}
                className="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                View Results
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={() => setShowCompletionModal(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Close"
                tabIndex={0}
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
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {showErrorModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="error-modal-title"
        >
          <div
            className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-lg dark:bg-gray-800 animate-fade-in-down"
            ref={errorModalRef}
          >
            <div className="flex flex-col items-center">
              {/* Error Icon */}
              <div className="inline-flex p-4 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900">
                <svg
                  className="w-12 h-12 text-red-600 dark:text-red-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3
                id="error-modal-title"
                className="mb-4 text-xl font-medium text-gray-900 dark:text-white"
              >
                Error
              </h3>
              <p className="mb-6 text-base text-center text-gray-500 dark:text-gray-400">
                {errorMessage}
              </p>
              <button
                type="button"
                onClick={handleErrorDismiss}
                className="text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
              >
                Close
              </button>

              {/* Close button */}
              <button
                type="button"
                onClick={handleErrorDismiss}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                aria-label="Close"
                tabIndex={0}
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
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Assessment />
  </StrictMode>,
);
