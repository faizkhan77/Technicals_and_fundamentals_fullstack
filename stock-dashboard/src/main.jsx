import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FundamentalsTablePage from "./FundamentalsTablePage.jsx";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <Router>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/fundamentals" element={<FundamentalsTablePage />} />
    </Routes>
  </Router>
);
