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

import resources from "../resourceData";
import { ResourcesUnion } from "../resourceData";

export function Resources() {
  const [resource, setResource] = useState<ResourcesUnion | null>(null);
  const [resourceExist, setResourceExist] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    initFlowbite();

    const params = new URLSearchParams(window.location.search);
    const resourceParam = params.get("resource") as string;

    if (!resources.has(resourceParam)) {
      console.info(resourceParam);
      console.info(!resources.has(resourceParam));

      setLoading(false);
      return;
    }

    setResourceExist(true);
    setResource(resources.get(resourceParam)!);

    setLoading(false);
  }, []);

  return (
    <>
      <Navbar />
      <section className="mt-20 bg-white dark:bg-gray-900 mx-auto">
        {loading ? (
          <div className="py-20 mx-auto flex justify-center">
            <Spinner />
          </div>
        ) : resourceExist ? (
          <>
            <section className="mt-20 bg-white dark:bg-gray-900">
              <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
                <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
                  {`${resource?.name}`}
                </h1>

                {resource?.displayData()}
              </div>
            </section>
          </>
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
