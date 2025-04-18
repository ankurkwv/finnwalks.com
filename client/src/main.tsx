import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Load Inter font explicitly
const interFontLink = document.createElement("link");
interFontLink.rel = "stylesheet";
interFontLink.href = "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap";
document.head.appendChild(interFontLink);

// Add page title and favicon
const title = document.createElement("title");
title.textContent = "CharlieWalks | Schedule Dog Walks";
document.head.appendChild(title);

// Add meta description
const metaDesc = document.createElement("meta");
metaDesc.name = "description";
metaDesc.content = "Schedule 30-minute dog-walking slots for Charlie the Aussie Doodle";
document.head.appendChild(metaDesc);

createRoot(document.getElementById("root")!).render(<App />);
