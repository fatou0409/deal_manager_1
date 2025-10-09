// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { StoreProvider } from "./store/StoreProvider.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import ToastProvider from "./components/ToastProvider.jsx"; // ⬅️ ajoute ça

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <StoreProvider>
          <ToastProvider>        {/* ⬅️ et enveloppe ici */}
            <App />
          </ToastProvider>
        </StoreProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
