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

export function Assessment() {
  const [assessment, setAssessment] = useState<Model>(new Model(surveyJson));

  // useEffect to handle assessment setting up and adding on completion handler
  useEffect(() => {
    const initialize = async () => {
      // New assessment instance
      const assessment = new Model(surveyJson);

      // Get current user and associate user id with assessment
      const user = await getCurrentUser();
      assessment.setValue("userId", user.userId);

      // Add assessment completion handler
      assessment.onComplete.add((assessment) => {
        // Handle assessment completion here by accessing assessment completion JSON with assessment.data
        console.log(assessment.data);
      });

      // Set assessment state
      setAssessment(assessment);
    };

    initialize();
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

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900">
        <Survey model={assessment} />
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
