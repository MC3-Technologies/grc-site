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

import { CmmcModel } from "../cmmcData";
import { cmmcLevel1Data } from "../cmmcData";

export function SecurityModels() {
  const [model, setModel] = useState<CmmcModel | null>(null);
  const [modelExists, setModelExists] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    initFlowbite();

    const params = new URLSearchParams(window.location.search);
    const modelParam = params.get("model") as "cmmclevel1" | null;
    console.log(modelParam);

    if (!["cmmclevel1"].includes(modelParam as string)) {
      setModelExists(false);
    } else {
      switch (modelParam) {
        case "cmmclevel1":
          setModel(cmmcLevel1Data);
          break;
      }
      setModelExists(true);
    }
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
        ) : modelExists ? (
          <>
            <section className="mt-20 bg-white dark:bg-gray-900 ">
              <div className="py-8 mx-auto max-w-screen-xl text-center lg:py-16 container px-0 md:px-6">
                <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
                  {`${model?.name}`}
                </h1>

                <div className="grid grid-cols-1 gap-5 my-10 md:mx-0 mx-2 ">
                  {model?.controlGroups.map((val, key) => (
                    <div
                      className=" p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
                      key={key}
                    >
                      <h5 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {val.name}
                      </h5>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-4 md:mx-0 ">
                        {val.controls.map((val2, key2) => (
                          <div
                            className=" p-6 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700"
                            key={key2}
                          >
                            <h5 className="mb-2 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                              {val2.name}
                            </h5>

                            <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                              {val2.description}
                            </p>
                            <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                              {val2.adherenceInstructions}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
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
    <SecurityModels />
  </StrictMode>
);
