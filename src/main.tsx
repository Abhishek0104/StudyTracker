import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { ProgressProvider } from "./hooks/ProgressContext";
import { ResourcesProvider } from "./hooks/ResourcesContext";
import { CurriculumProvider } from "./hooks/CurriculumContext";
import { SyncProvider } from "./hooks/SyncContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <ProgressProvider>
        <ResourcesProvider>
          <CurriculumProvider>
            <SyncProvider>
              <App />
            </SyncProvider>
          </CurriculumProvider>
        </ResourcesProvider>
      </ProgressProvider>
    </HashRouter>
  </React.StrictMode>,
);
