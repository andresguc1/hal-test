import React from "react";
import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import "./LanguageSelector.css";

export default function LanguageSelector() {
  const { i18n } = useTranslation();

  const toggleLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="language-selector">
      <div className="language-icon">
        <Languages size={18} />
      </div>
      <div className="language-options">
        <button
          className={`lang-btn ${i18n.language.startsWith("en") ? "active" : ""}`}
          onClick={() => toggleLanguage("en")}
        >
          EN
        </button>
        <span className="divider">|</span>
        <button
          className={`lang-btn ${i18n.language.startsWith("es") ? "active" : ""}`}
          onClick={() => toggleLanguage("es")}
        >
          ES
        </button>
      </div>
    </div>
  );
}
