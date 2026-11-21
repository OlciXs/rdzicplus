import { BrowserRouter } from "react-router-dom";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { loadParams } from "./calculators/config.js";
import "./themes.css"; // jedyny plik ze stylami w całej aplikacji

// Najpierw parametry z panelu admina (stawki, limity), potem aplikacja –
// dzięki temu kalkulatory od pierwszego renderu liczą z aktualnymi wartościami.
loadParams().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});
