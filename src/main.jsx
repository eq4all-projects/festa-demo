import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { BGMProvider } from "./contexts/BGMContext.jsx";
import "./index.css";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <BGMProvider>
      <App />
    </BGMProvider>
  </BrowserRouter>
);
