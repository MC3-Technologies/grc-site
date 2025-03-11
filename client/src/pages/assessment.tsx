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

export function Assessment() {
  const [survey] = useState(new Model(surveyJson));

  useEffect(() => {
    initFlowbite();

    const storedDarkMode = localStorage.getItem("darkMode") === "true";
    if (storedDarkMode) {
      survey.applyTheme(BorderlessDark);
    } else {
      survey.applyTheme(BorderlessLight);
    }

    const handleDarkMode = () => survey.applyTheme(BorderlessDark);
    const handleLightMode = () => survey.applyTheme(BorderlessLight);

    window.addEventListener("darkMode", handleDarkMode);
    window.addEventListener("lightMode", handleLightMode);

    return () => {
      window.removeEventListener("darkMode", handleDarkMode);
      window.removeEventListener("lightMode", handleLightMode);
    };
  }, [survey]);

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900">
        <Survey model={survey} />
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

// import { StrictMode, useEffect } from "react";
// import { createRoot } from "react-dom/client";
// import { initFlowbite } from "flowbite";

// import "../index.css";
// import "survey-core/defaultV2.min.css";

// import Navbar from "../components/Navbar";
// import Chat from "../components/Chat";
// import Footer from "../components/Footer";

// export function Assessment() {
//   useEffect(() => {
//     initFlowbite();
//   }, []);

//   return (
//     <>
//       <Navbar />
//       <section className="mt-20 bg-white dark:bg-gray-900">
//         Assessment page
//       </section>
//       <Chat />
//       <Footer />
//     </>
//   );
// }

// createRoot(document.getElementById("root")!).render(
//   <StrictMode>
//     <Assessment />
//   </StrictMode>,
// );
