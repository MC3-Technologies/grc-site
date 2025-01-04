import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect, useState } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";
import Spinner from "../components/Spinner";
import PageNotFound from "../components/PageNotFound";

export function Resources() {
  const [resource, setResource] = useState<
    "it-security" | "hipaa-security" | "pci-dss-security" | null
  >(null);
  const [resourceExist, setResourceExist] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    initFlowbite();

    const params = new URLSearchParams(window.location.search);
    const resourceParam = params.get("resource") as
      | "it-security"
      | "hipaa-security"
      | "pci-dss-security"
      | null;

    if (
      !["it-security", "hipaa-security", "pci-dss-security"].includes(
        resourceParam as string
      )
    ) {
      setResourceExist(false);
    } else {
      setResource(resourceParam);
      setResourceExist(true);
    }
    setLoading(false);
  }, []);

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900">
        {loading ? (
          <div className="py-20 mx-auto flex justify-center">
            <Spinner />
          </div>
        ) : resourceExist ? (
          <>{resource}</>
        ) : (
          <PageNotFound />
        )}
      </section>
      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Resources />
  </StrictMode>
);
