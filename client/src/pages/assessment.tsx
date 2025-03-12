import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";

import "../index.css";
import "survey-core/defaultV2.min.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";

import { surveyJson } from "../assessmentQuestions";
import { Model, Survey } from "survey-react-ui";
import { BorderlessDark, BorderlessLight } from "survey-core/themes";
import { getCurrentUser } from "../amplify/auth";
import { fetchAuthSession } from "aws-amplify/auth";
import { uploadData } from "aws-amplify/storage";
import { createRandomUrlSafeHash } from "../utils/assessmentHash";
import { isLoggedIn } from "../amplify/auth";
import { redirectToSignIn } from "../utils/routing";
import Spinner from "../components/Spinner";

export function Assessment() {
  const [assessment, setAssessment] = useState<Model>(new Model(surveyJson));
  const [loading, setLoading] = useState<boolean>(true);

  // useEffect to handle assessment setting up and adding on completion handler
  useEffect(() => {
    const initialize = async () => {
      const loggedIn = await isLoggedIn();
      if (!loggedIn) {
        redirectToSignIn();
        return;
      }

      // New assessment instance
      const assessment = new Model(surveyJson);

      // Get current user and associate user id with assessment
      const user = await getCurrentUser();
      assessment.setValue("userId", user.userId);

      // Add assessment completion handler
      assessment.onComplete.add(async (assessment, options) => {
        // Show assessment uploading in progress
        options.showSaveInProgress();

        try {
          // Turn assessment data json into a string -> blob -> File to be uploaded
          const jsonString = JSON.stringify(assessment.data, null, 2);
          const blob = new Blob([jsonString], { type: "application/json" });
          const file = new File([blob], `${createRandomUrlSafeHash()}.json`, {
            type: "application/json",
          });

          // Call upload assessment data file
          await handleCompletedAssessmentUpload(file);

          // Success of uploading assessment
          options.showSaveSuccess();
        } catch (e) {
          options.showSaveError(`${e}`);
        }
      });

      // Set assessment state
      setAssessment(assessment);
    };

    initialize().then(() => {
      setLoading(false);
    });
  }, []);

  // useEffect to handle theme changes
  useEffect(() => {
    initFlowbite();

    const storedDarkMode = localStorage.getItem("darkMode") === "true";
    if (storedDarkMode) {
      assessment.applyTheme(BorderlessDark);
    } else {
      assessment.applyTheme(BorderlessLight);
    }

    const handleDarkMode = () => assessment.applyTheme(BorderlessDark);
    const handleLightMode = () => assessment.applyTheme(BorderlessLight);

    window.addEventListener("darkMode", handleDarkMode);
    window.addEventListener("lightMode", handleLightMode);

    return () => {
      window.removeEventListener("darkMode", handleDarkMode);
      window.removeEventListener("lightMode", handleLightMode);
    };
  }, [assessment]);

  const handleCompletedAssessmentUpload = async (
    assessment: File
  ): Promise<void> => {
    if (!assessment) {
      throw new Error("No assessment found");
    }

    // Fetch authentication session to upload with session id
    const session = await fetchAuthSession();
    try {
      // Uploade JSON assessmet file
      const res = await uploadData({
        path: `assessments/${session.identityId}/completed/${assessment.name}`,
        data: assessment,
        options: {
          bucket: "assessmentStorage",
        },
      }).result;

      console.log("Assessment uploaded successfully", res);
    } catch (e) {
      if (e) {
        throw new Error(`Error uploading assessment : ${e}`);
      }
    }
  };

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner />
          </div>
        ) : (
          <>
            <Survey model={assessment} />
          </>
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
