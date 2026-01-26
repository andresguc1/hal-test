import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Translation resources
const resources = {
  en: {
    translation: {
      hero: {
        title_part1: "hal",
        title_part2: "Test",
        subtitle: "Modern, visual automation framework.",
      },
      features: {
        visual_editor: {
          title: "Visual Flow Editor",
          description:
            "Drag-and-drop orchestration with 50+ specialized nodes. No code required.",
        },
        advanced_control: {
          title: "Advanced Control",
          description:
            "Network interception, AI integration, and session management.",
        },
      },
      cta: {
        open_source: "Open Source & Free",
        launch_app: "Launch App",
        star_github: "Star on GitHub",
        community: "Community",
      },
      nav: {
        status: "Status: Operating",
      },
      language: {
        en: "English",
        es: "Español",
      },
    },
  },
  es: {
    translation: {
      hero: {
        title_part1: "hal",
        title_part2: "Test",
        subtitle: "Framework moderno de automatización visual.",
      },
      features: {
        visual_editor: {
          title: "Editor Visual de Flujos",
          description:
            'Orquestación "drag-and-drop" con más de 50 nodos especializados. Sin código.',
        },
        advanced_control: {
          title: "Control Avanzado",
          description:
            "Intercepción de red, integración con IA y gestión de sesiones.",
        },
      },
      cta: {
        open_source: "Open Source y Gratis",
        launch_app: "Lanzar App",
        star_github: "Estrella en GitHub",
        community: "Comunidad",
      },
      nav: {
        status: "Estado: Operando",
      },
      language: {
        en: "English",
        es: "Español",
      },
    },
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
