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

    switch (tabParam) {
      case "sign-in":
        return <AmplifyAuth />;
      case "sign-up":
        return <AmplifyAuth initalTab="signUp" />;
      case "forgot-password":
        return <AmplifyAuth initalTab="forgotPassword" />;
      default:
        return <AmplifyAuth />;
    }
  };

  return (
    <>
      <Navbar />
      <section className="bg-gray-50 dark:bg-gray-900 md:mt-0 mt-20">
        <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0">
          <a
            href="/"
            className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white"
          >
            <img
              className="w-12 h12 mr-2"
              src="/logo-transparent.png"
              alt="logo"
            />
            MC3 Technologies
          </a>
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
  </StrictMode>
);
