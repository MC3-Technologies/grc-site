import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { initFlowbite } from "flowbite";
import { useEffect } from "react";

import "../index.css";

import Navbar from "../components/Navbar";
import Chat from "../components/Chat";
import Footer from "../components/Footer";

export function Osint() {
  useEffect(() => {
    initFlowbite();
  }, []);

  return (
    <>
      <Navbar />
      <section className="bg-white">This is the OSINT scanning page.</section>
      <Chat />
      <Footer />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Osint />
  </StrictMode>
);
