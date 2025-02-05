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
import FileDownloadButton from "../components/FileDownloadButton";

import ItResourceCover from "../assets/it-resource-cover.png";
import HippaResoureCover from "../assets/hippa-resource-cover.png";
import PciDssResourceCover from "../assets/pci-dss-resource-cover.png";
import LoadingImage from "../components/LoadingImage";

type Resource = {
  name: string;
  description: string;
  frameworksUtilized: Framework;
  fileName: string;
  coverPicture: string;
};

type Framework = {
  name: string;
  url: string | null;
};

const howToUtilize =
  '1. Download the necessary Word documents. \n 2. Replace "Company Name" with your organization’s name in the highlighted areas. \n 3. Proofread each policy to ensure they align with your organization’s needs. \n 4. Make any necessary changes. \n 5. Share the updated policies with the relevant teams and ensure management enforces them properly.';

const resources: Resource[] = [
  {
    name: "IT Security",
    description:
      "IT security protects your digital information, including personal data like passwords and credit card numbers, as well as important business data, from threats.",
    frameworksUtilized: {
      name: "CIS 18 IG1 v8",
      url: "https://www.cisecurity.org/controls/implementation-groups/ig1",
    },
    fileName: "InfoSec-Policy-CIS-v8-IG1-Template.docx",
    coverPicture: ItResourceCover,
  },
  {
    name: "HIPAA Security",
    description:
      "HIPAA, or the Health Insurance Portability and Accountability Act, protects the privacy and security of your health information, ensuring that personal medical data remains confidential and secure.",
    frameworksUtilized: {
      name: "HIPAA Security Rule",
      url: "https://www.hhs.gov/hipaa/for-professionals/security/laws-regulations/index.html",
    },
    fileName: "HIPAA-Policy-Template.docx",
    coverPicture: HippaResoureCover,
  },
  {
    name: "PCI DSS Security",
    description:
      "PCI DSS, or the Payment Card Industry Data Security Standard, protects your credit card information by setting standards for secure handling, ensuring that payment data remains safe from fraud and breaches.",
    frameworksUtilized: {
      name: "PCI DSS 4.0.1",
      url: "https://docs-prv.pcisecuritystandards.org/PCI%20DSS/Standard/PCI-DSS-v4_0_1.pdf",
    },
    fileName: "PCI-DSS-4.0.1-Security-Policy-Template.docx",
    coverPicture: PciDssResourceCover,
  },
];

export function Resources() {
  const [resource, setResource] = useState<Resource | null>(null);
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
        resourceParam as string,
      )
    ) {
      setResourceExist(false);
    } else {
      switch (resourceParam) {
        case "it-security":
          setResource(resources[0]);
          break;
        case "hipaa-security":
          setResource(resources[1]);
          break;
        case "pci-dss-security":
          setResource(resources[2]);
          break;
      }
      setResourceExist(true);
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
        ) : resourceExist ? (
          <>
            <section className="mt-20 bg-white dark:bg-gray-900">
              <div className="py-8 px-4 mx-auto max-w-screen-xl text-center lg:py-16 lg:px-12">
                <h1 className="mb-4 text-4xl font-extrabold tracking-tight leading-none text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
                  {`${resource?.name} Policy`}
                </h1>

                <div className="grid md:grid-cols-2 gap-5 my-10 md:mx-0 mx-2">
                  <div className="grid gap-5  md:mx-0 mx-2">
                    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow md:flex-row md:max-w-xl  dark:border-gray-700 dark:bg-gray-800 ">
                      <div className="flex flex-col justify-between p-4 leading-normal">
                        <h5 className="inline-flex justify-center items-center mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                          <svg
                            className="w-7 h-7 mr-2"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M10 11h2v5m-2 0h4m-2.592-8.5h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>

                          {`What is ${resource?.name}?`}
                        </h5>
                        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400">
                          {resource?.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow md:flex-row md:max-w-xl  dark:border-gray-700 dark:bg-gray-800 ">
                      <div className="flex flex-col justify-between p-4 leading-normal">
                        <h5 className="inline-flex justify-center items-center mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                          <svg
                            className="w-7 h-7 mr-2"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12.356 3.066a1 1 0 0 0-.712 0l-7 2.666A1 1 0 0 0 4 6.68a17.695 17.695 0 0 0 2.022 7.98 17.405 17.405 0 0 0 5.403 6.158 1 1 0 0 0 1.15 0 17.406 17.406 0 0 0 5.402-6.157A17.694 17.694 0 0 0 20 6.68a1 1 0 0 0-.644-.949l-7-2.666Z" />
                          </svg>
                          Frameworks Utilized
                        </h5>
                        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 ">
                          This security policy utilizes the{" "}
                          {resource?.frameworksUtilized.url ? (
                            <>
                              <a
                                className="underline"
                                target="_blank"
                                href={resource.frameworksUtilized.url}
                              >
                                {resource?.frameworksUtilized.name}
                              </a>
                            </>
                          ) : (
                            <>{resource?.frameworksUtilized.name}</>
                          )}{" "}
                          framework to ensure compliance.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-center bg-white border border-gray-200 rounded-lg shadow p-5 dark:border-gray-700 dark:bg-gray-800 ">
                      <div className="flex flex-col justify-between  leading-normal">
                        <h5 className="inline-flex justify-center items-center mb-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                          How to Utilize this Policy
                        </h5>
                        <p className="mb-3 font-normal text-gray-700 dark:text-gray-400 whitespace-pre-line">
                          {howToUtilize}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-center ">
                    {resource?.coverPicture ? (
                      <LoadingImage
                        imageUri={resource?.coverPicture}
                        className="rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 "
                      />
                    ) : null}
                  </div>
                </div>
                <div className="flex justify-center items-center">
                  {resource?.fileName ? (
                    <FileDownloadButton fileName={resource?.fileName} />
                  ) : null}
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
    <Resources />
  </StrictMode>,
);
