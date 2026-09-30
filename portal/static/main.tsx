import { createRoot } from "react-dom/client";
import StaticPortal from "./portal";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(<StaticPortal />);
