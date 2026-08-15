import React from "react";
import {applyTelegramTheme, tg} from "./tg";
import {createRoot} from "react-dom/client";
import App from "./App";
import "./styles.css";

tg.ready()
tg.expand()

tg.disableVerticalSwipes?.();
applyTelegramTheme();
tg.onEvent("themeChanged", applyTelegramTheme);

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
