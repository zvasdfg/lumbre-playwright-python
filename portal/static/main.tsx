import { createRoot } from "react-dom/client";
import StaticPortal from "./portal";
import "./globals.css";
import "./mobile-hero.css";
import "./label-theme.css";
import "./ux-audit.css";

createRoot(document.getElementById("root")!).render(<StaticPortal />);
