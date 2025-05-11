import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import AmplifyAuth from "../components/AmplifyAuth";

export function Auth() {
  useEffect(() => {
    initFlowbite();
  }, []);

  const getAmplifyAuthWithTab = () => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get("tab") as
      | "sign-in"
      | "sign-up"
      | "forgot-password"
      | null;

    // Check for mode parameter (for change-password)
    const modeParam = params.get("mode");

    // Let the AmplifyAuth component handle the mode
    if (modeParam) {
      return <AmplifyAuth />;
    }

    switch (tabParam) {
      case "sign-in":
        return <AmplifyAuth />;
      case "sign-up":
        return <AmplifyAuth initialTab="signUp" />;
      case "forgot-password":
        return <AmplifyAuth initialTab="forgotPassword" />;
      default:
        return <AmplifyAuth />;
    }
  };

  return (
    <>
      <Navbar />
      <section className="bg-gray-50 dark:bg-gray-900 md:mt-0 mt-20">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          {getAmplifyAuthWithTab()}
        </div>
      </section>
      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Auth />
  </StrictMode>,
);
