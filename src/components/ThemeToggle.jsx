// src/components/ThemeToggle.jsx
import { useState, useEffect } from "react";

function ThemeToggle() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.body.className = theme; // apply theme globally
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      style={{ marginTop: "1rem" }}
    >
      {theme === "dark" ? "🌞 Light Mode" : "🌙 Dark Mode"}
    </button>
  );
}

export default ThemeToggle;
