import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";

export function Report() {
  useEffect(() => {
    initFlowbite();
  }, []);

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900">
        This is the report page.
      </section>
      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Report />
  </StrictMode>,
);
