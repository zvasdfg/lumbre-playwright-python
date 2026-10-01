import { createRoot } from "react-dom/client";
import StaticPortal from "./portal";
import "../app/globals.css";
import "./mobile-hero.css";

createRoot(document.getElementById("root")!).render(<StaticPortal />);
