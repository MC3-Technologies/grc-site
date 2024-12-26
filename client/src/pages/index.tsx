import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "../index.css";

import reactLogo from "../assets/react.svg";
import viteLogo from "/vite.svg";

import ExampleComponent from "../components/ExampleComponent";

export function Index() {
  return (
    <>
      <div className="container flex justify-center max-w-screen-xl mx-auto">
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
        <h1 className="text-2xl font-bold text-red-500 underline">
          GRC Website
        </h1>
        <ExampleComponent />
      </div>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Index />
  </StrictMode>
);
