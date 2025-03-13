import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";

import "../index.css";
import "survey-core/defaultV2.min.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import { isLoggedIn } from "../amplify/auth";
import {
  redirectToInProgressAssessment,
  redirectToSignIn,
} from "../utils/routing";
import Spinner from "../components/Spinner";

import { CompletedAssessment, InProgressAssessment } from "../utils/assessment";

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
  // Error loading assessment(s) data
  const [loadingError, setLoadingError] = useState<string[]>([]);
  // Is loading
  const [loading, setLoading] = useState<boolean>(true);

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
        // Fetch users in progress assessments
        const inProgressAssessments =
          await InProgressAssessment.fetchAllAssessments();
        setInProgressAssessments(inProgressAssessments);

        // Fetch users completed assessments
        const completedAssessments =
          await CompletedAssessment.fetchAllCompletedAssessments();
        setCompletedAssessments(completedAssessments);
      } catch (e) {
        console.error(e);
        setLoadingError((prev) => [...prev, `${e}`]);
      }
    };

    // Call initialize function then set laoding to false
    initialize().then(() => {
      setLoading(false);
    });
  }, []);

  // Creating new assessments handler
  const handleCreateNewAssessment = async (name: string) => {
    const id = await InProgressAssessment.createAssessment(name);
    redirectToInProgressAssessment(id);
  };

  // Delete in progress assessment handler
  const handleDeleteInProgressAssessment = async (id: string) => {
    await InProgressAssessment.deleteAssessment(id);
  };

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900 px-4 py-8">
        <div className="container mx-auto max-w-6xl">
          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : (
            <>
              {loadingError.length > 0 ? (
                <div>
                  {loadingError.map((err, key) => (
                    <p key={key}>{err}</p>
                  ))}
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
                            Organization Name
                          </label>
                          <input
                            type="text"
                            value={newAssessmentName}
                            onChange={(e) =>
                              setNewAssessmentName(e.target.value)
                            }
                            className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-4 w-full text-gray-700 dark:text-white"
                            placeholder="Enter organization name"
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
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                  <p>Started: {assessment.createdAt}</p>
                                  <p>Last updated: {assessment.updatedAt}</p>
                                </div>
                                <div className="mt-4 flex space-x-2">
                                  <a
                                    href={`/assessment/?assessment-id=${assessment.id}`}
                                    className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors"
                                  >
                                    Continue
                                  </a>
                                  <button
                                    onClick={() =>
                                      handleDeleteInProgressAssessment(
                                        assessment.id
                                      )
                                    }
                                    className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors"
                                  >
                                    Delete
                                  </button>
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
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                  <p>Completed: {assessment.completedAt}</p>
                                  <p>Score: {assessment.complianceScore}%</p>
                                  <p>
                                    Status:{" "}
                                    <span
                                      className={
                                        assessment.isCompliant
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {assessment.isCompliant
                                        ? "Compliant"
                                        : "Non-Compliant"}
                                    </span>
                                  </p>
                                </div>
                                {/* <div className="mt-4 flex space-x-2">
                                <button
                                  onClick={() => loadAssessment(assessment.id)}
                                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => deleteAssessment(assessment.id)}
                                  className="bg-red-600 hover:bg-red-700 text-white font-medium py-1 px-3 rounded-md text-sm transition-colors"
                                >
                                  Delete
                                </button>
                              </div> */}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
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
  </StrictMode>
);
