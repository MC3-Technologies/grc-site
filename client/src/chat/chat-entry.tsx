import React from "react";
import { createRoot } from "react-dom/client";
import { FullScreenChat } from "./chat";
import "../index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FullScreenChat />
  </React.StrictMode>
); 