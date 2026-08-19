import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { importAuthFromUrl } from "./lib/auth";
import "./index.css";
import App from "./App.jsx";

importAuthFromUrl();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
