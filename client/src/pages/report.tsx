import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect, useState } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";

import { CompletedAssessment } from "../utils/assessment";
import { fetchUsers } from "../utils/adminUser";

import { ReportResult } from "../utils/report";
import { Report as Rpt } from "../utils/report";

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
        // Grab assessment storage json
        const assessmentJsonData =
          await CompletedAssessment.fetchAssessmentStorageData(
            assessmentIdParam
          );

        // New report isntance
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
            console.log(`Mapped user ID ${userId} to email ${userEmail}`);
          }
        });
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

      return <></>;
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
    <Report />
  </StrictMode>
);
