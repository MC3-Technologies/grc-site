import { StrictMode, useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { fetchUserAttributes } from "aws-amplify/auth"; // Import fetchUserAttributes

import "../index.css";
import "survey-core/defaultV2.min.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import { isLoggedIn } from "../amplify/auth"; // Remove isCurrentUserAdmin import
import {
  redirectToInProgressAssessment,
  redirectToSignIn,
  redirectToCompletedAssessment,
} from "../utils/routing";
import Spinner from "../components/Spinner";

import { CompletedAssessment, InProgressAssessment } from "../utils/assessment";
import { fetchUsers } from "../utils/adminUser";

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
const calculateDuration = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const durationMs = end.getTime() - start.getTime();

  const days = Math.floor(durationMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (durationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else {
    return `${hours}h`;
  }
};

// Helper function to calculate time elapsed since a given date
const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} minute${diffMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "Just now";
  }
};

// Toast notification type
interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

type DeleteAssessmentButtonProps = {
  handler: (id: string) => Promise<void>;
  assessmentId: string;
};

const DeleteAssessmentButton: React.FC<DeleteAssessmentButtonProps> = ({
  handler,
  assessmentId,
}): React.JSX.Element => {
  const [deleting, setDeleting] = useState<boolean>(false);

  const handleDelete = async () => {
    setDeleting(true);
    await handler(assessmentId)
      .catch((err) => {
        console.error(`Error deleting assessment : ${err}`);
      })
      .finally(() => {
        setDeleting(false);
      });
  };

  return (
    <>
      {deleting ? (
        <Spinner />
      ) : (
        <button
          onClick={handleDelete}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors"
        >
          Delete
        </button>
      )}
    </>
  );
};

export function Assessments() {
  // Completed assessments state
  const [completedAssessments, setCompletedAssessments] = useState<
    {
      id: string;
      name: string;
      completedAt: string;
      isCompliant: boolean;
      storagePath: string;
      complianceScore: number;
      version: string;
      owner: string | null;
      readonly createdAt: string;
      readonly updatedAt: string;
    }[]
  >([]);
  // In progress assessments state
  const [inProgressAssessments, setInProgressAssessments] = useState<
    {
      id: string;
      name: string;
      percentCompleted: number;
      storagePath: string;
      owner: string | null;
      version: string;
      readonly createdAt: string;
      readonly updatedAt: string;
    }[]
  >([]);

  // Whether to show new assessment form
  const [showNewAssessmentForm, setShowNewAssessmentForm] =
    useState<boolean>(false);
  // New assessment name state
  const [newAssessmentName, setNewAssessmentName] = useState<string>("");
  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  // Is loading
  const [loading, setLoading] = useState<boolean>(true);

  // New state for user ID to email mapping (for admins)
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  // State for current user info
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserSub, setCurrentUserSub] = useState<string | null>(null);
  // Removed unused isAdmin state

  // Add a toast notification
  const addToast = useCallback(
    (message: string, type: "error" | "success" | "info" = "error") => {
      const id = Date.now().toString();
      setToasts((prev) => [...prev, { id, message, type }]);

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        dismissToast(id);
      }, 5000);
    },
    [], // Empty dependency array ensures this function is memoized and doesn't change on each render.
  );

  // Dismiss a toast notification
  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Load users and create user ID to email mapping
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
            console.log(`Mapped user ID ${userId} to email ${userEmail}`);
          }
        });

        setUserMap(userMapping);
        console.log("User ID to email mapping created:", userMapping);
      } catch (error) {
        console.error("Error creating user mapping:", error);
      }
    };

    loadUserMap();

    // Set up interval to periodically refresh user mapping
    const refreshInterval = setInterval(loadUserMap, 30000);

    return () => {
      clearInterval(refreshInterval);
    };
  }, []);

  // useEffect to handle assessment setting up and adding on completion handler
  useEffect(() => {
    initFlowbite();

    // Initialize function
    const initialize = async () => {
      // Check if user is logged in and if not, redirect to sign in page
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        redirectToSignIn();
        return;
      }

      try {
        // Fetch current user's attributes
        const userAttributes = await fetchUserAttributes();
        const userEmail = userAttributes.email || null;
        const userSub = userAttributes.sub || null;
        setCurrentUserEmail(userEmail);
        setCurrentUserSub(userSub);
        console.log("Current user info:", { email: userEmail, sub: userSub });

        // Removed admin check

        // Fetch ALL assessments first
        const allInProgressAssessments =
          await InProgressAssessment.fetchAllAssessments();
        const allCompletedAssessments =
          await CompletedAssessment.fetchAllCompletedAssessments();

        // Filter assessments to show only those owned by the current user for this page
        if (userSub) {
          const myInProgress = allInProgressAssessments.filter(
            (assessment) => assessment.owner === userSub,
          );
          const myCompleted = allCompletedAssessments.filter(
            (assessment) => assessment.owner === userSub,
          );
          setInProgressAssessments(myInProgress);
          setCompletedAssessments(myCompleted);
        } else {
          // Should not happen if logged in, but handle defensively
          setInProgressAssessments([]);
          setCompletedAssessments([]);
        }
      } catch (e) {
        console.error(e);
        addToast(`Error loading assessments: ${e}`);
      }
    };

    // Call initialize function then set laoding to false
    initialize().finally(() => {
      setLoading(false);
    });
  }, [addToast]);

  // Creating new assessments handler
  const handleCreateNewAssessment = async (name: string) => {
    try {
      const id = await InProgressAssessment.createAssessment(name);
      redirectToInProgressAssessment(id);
    } catch (error) {
      console.error("Error creating assessment:", error);
      addToast(`Failed to create assessment: ${error}`);
    }
  };

  // Delete in progress assessment handler
  const handleDeleteInProgressAssessment = async (id: string) => {
    try {
      await InProgressAssessment.deleteAssessment(id);
      // Update state to remove the deleted assessment
      setInProgressAssessments((prevAssessments) =>
        prevAssessments.filter((assessment) => assessment.id !== id),
      );
      addToast("Assessment deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting in-progress assessment:", error);
      addToast(`Failed to delete assessment: ${error}`);
    }
  };

  // Delete completed assessment handler
  const handleDeleteCompleteAssessment = async (id: string) => {
    try {
      await CompletedAssessment.deleteAssessment(id);
      // Update state to remove the deleted assessment
      setCompletedAssessments((prevAssessments) =>
        prevAssessments.filter((assessment) => assessment.id !== id),
      );
      addToast("Assessment deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting completed assessment:", error);
      addToast(`Failed to delete assessment: ${error}`);
    }
  };

  return (
    <>
      <Navbar />

      {/* Toast notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-md">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center justify-between p-4 rounded-lg shadow-lg animate-slideIn ${
              toast.type === "error"
                ? "bg-red-50 text-red-800 border-l-4 border-red-500 dark:bg-red-900/30 dark:text-red-200"
                : toast.type === "success"
                  ? "bg-green-50 text-green-800 border-l-4 border-green-500 dark:bg-green-900/30 dark:text-green-200"
                  : "bg-blue-50 text-blue-800 border-l-4 border-blue-500 dark:bg-blue-900/30 dark:text-blue-200"
            }`}
          >
            <div className="flex items-center">
              {toast.type === "error" && (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              )}
              {toast.type === "success" && (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              )}
              {toast.type === "info" && (
                <svg
                  className="w-5 h-5 mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2h2a1 1 0 100-2H9z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              )}
              <p>{toast.message}</p>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="ml-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-5 h-5"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                ></path>
              </svg>
            </button>
          </div>
        ))}
      </div>

      <section className="mt-20 bg-white dark:bg-gray-900 px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <>
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                    CMMC Level 1 Assessments
                  </h1>
                  <button
                    onClick={() => setShowNewAssessmentForm(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    New Assessment
                  </button>
                </div>

                {showNewAssessmentForm && (
                  <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg mb-6">
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      Create New Assessment
                    </h2>
                    <div className="mb-4">
                      <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        Assessment name
                      </label>
                      <input
                        type="text"
                        value={newAssessmentName}
                        onChange={(e) => setNewAssessmentName(e.target.value)}
                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 w-full text-gray-700 dark:text-white"
                        placeholder="Enter a name for your assessment"
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          handleCreateNewAssessment(newAssessmentName);
                        }}
                        disabled={!newAssessmentName.trim()}
                        className={`bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors ${
                          !newAssessmentName.trim()
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                      >
                        Create
                      </button>
                      <button
                        onClick={() => {
                          setShowNewAssessmentForm(false);
                          setNewAssessmentName("");
                        }}
                        className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-8">
                  {/* In Progress Assessments */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      In Progress
                    </h2>

                    {inProgressAssessments.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        No in-progress assessments found.
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {inProgressAssessments.map((assessment) => (
                          <div
                            key={assessment.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm"
                          >
                            <div className="flex justify-between">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {assessment.name}
                              </h3>
                              <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                                In Progress
                              </span>
                            </div>

                            {/* Version Information */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                v{assessment.version}
                              </span>
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              <p>Started: {formatDate(assessment.createdAt)}</p>
                              <p>
                                Last updated: {formatDate(assessment.updatedAt)}
                              </p>

                              {/* Time Since Last Update */}
                              <p className="text-sm italic mt-1">
                                Last activity:{" "}
                                {getTimeAgo(assessment.updatedAt)}
                              </p>

                              {/* Owner Details */}
                              {assessment.owner && (
                                <p className="flex items-center mt-1">
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
                                  Owner:{" "}
                                  {assessment.owner === currentUserSub
                                    ? currentUserEmail // Display current user's email if they are the owner
                                    : userMap[assessment.owner] || // Otherwise, use the map (for admins)
                                      (assessment.owner?.includes("@") // Fallback 1: If owner is already email
                                        ? assessment.owner
                                        : assessment.owner)}{" "}
                                  {/* Fallback 2: Raw owner ID/UUID */}
                                </p>
                              )}

                              {/* Progress bar */}
                              <div className="mt-3">
                                <div className="flex justify-between mb-1">
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    Progress
                                  </span>
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {assessment.percentCompleted}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                                  <div
                                    className="bg-primary-600 h-2.5 rounded-full"
                                    style={{
                                      width: `${assessment.percentCompleted}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                              <a
                                href={`/assessment/?assessment-id=${assessment.id}`}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors"
                              >
                                Continue
                              </a>
                              <DeleteAssessmentButton
                                handler={handleDeleteInProgressAssessment}
                                assessmentId={assessment.id}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Completed Assessments */}
                  <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                      Completed
                    </h2>
                    {completedAssessments.length === 0 ? (
                      <p className="text-gray-500 dark:text-gray-400">
                        No completed assessments found.
                      </p>
                    ) : (
                      <div className="grid gap-4 md:grid-cols-2">
                        {completedAssessments.map((assessment) => (
                          <div
                            key={assessment.id}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-5 shadow-sm"
                          >
                            <div className="flex justify-between">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {assessment.name}
                              </h3>
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                                Completed
                              </span>
                            </div>

                            {/* Version Information */}
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full">
                                v{assessment.version}
                              </span>
                            </div>

                            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                              <p>
                                Completed: {formatDate(assessment.completedAt)}
                              </p>

                              {/* Duration Metrics */}
                              <p>
                                Duration:{" "}
                                {calculateDuration(
                                  assessment.createdAt,
                                  assessment.completedAt,
                                )}
                              </p>

                              {/* Owner Details */}
                              {assessment.owner && (
                                <p className="flex items-center">
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
                                  Owner:{" "}
                                  {assessment.owner === currentUserSub
                                    ? currentUserEmail // Display current user's email if they are the owner
                                    : userMap[assessment.owner] || // Otherwise, use the map (for admins)
                                      (assessment.owner?.includes("@") // Fallback 1: If owner is already email
                                        ? assessment.owner
                                        : assessment.owner)}{" "}
                                  {/* Fallback 2: Raw owner ID/UUID */}
                                </p>
                              )}

                              <p>Score: {assessment.complianceScore}%</p>

                              {/* Visual Compliance Indicator */}
                              <div className="mt-3">
                                <div
                                  className={`flex items-center p-2 rounded-md ${
                                    assessment.isCompliant
                                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/50"
                                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50"
                                  }`}
                                >
                                  <div
                                    className={`p-1.5 rounded-full mr-2 ${
                                      assessment.isCompliant
                                        ? "bg-green-500 text-white"
                                        : "bg-red-500 text-white"
                                    }`}
                                  >
                                    {assessment.isCompliant ? (
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
                                      assessment.isCompliant
                                        ? "text-green-800 dark:text-green-200"
                                        : "text-red-800 dark:text-red-200"
                                    }`}
                                  >
                                    {assessment.isCompliant
                                      ? "CMMC Level 1 Compliant"
                                      : "Not Compliant with CMMC Level 1"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                              <button
                                onClick={() =>
                                  redirectToCompletedAssessment(assessment.id)
                                }
                                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors"
                              >
                                View
                              </button>
                              <DeleteAssessmentButton
                                handler={handleDeleteCompleteAssessment}
                                assessmentId={assessment.id}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
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
    <Assessments />
  </StrictMode>,
);
