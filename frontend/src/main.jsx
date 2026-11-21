import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./themes.css"; // jedyny plik ze stylami w całej aplikacji

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
