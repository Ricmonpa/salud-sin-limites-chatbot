import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import './i18n';
import { initAmplitude } from './amplitude';

// Inicializar Amplitude al cargar la aplicación
initAmplitude();
 
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 