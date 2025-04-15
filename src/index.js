import { createRoot } from "react-dom/client";
import "./style.css";
import App from "./App";
import { Leva } from "leva";

createRoot(document.getElementById("root")).render(
  <>
    <App />
    <Leva collapsed />
  </>
);
