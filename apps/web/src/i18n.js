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
        headline_part1: "The Missing Link",
        headline_part2: "in Automation",
        desc1: "No-code flow builder with AI-powered healing",
        desc2: "and real-time Playwright execution.",
        zero_config: "Zero config. No cloning required.",
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
      stats: {
        flows: "Flows Executed",
        nodes: "Node Types",
        success: "Success Rate",
        source: "Open Source",
      },
      pricing: {
        title_part1: "Unlock Your",
        title_part2: "Full Potential",
        subtitle: "Simple, scalable pricing for teams of all sizes.",
        enterprise_title: "Looking for enterprise solutions?",
        enterprise_subtitle: "Custom deployments & SLAs",
        tiers: {
          starter: {
            title: "STARTER",
            price: "FREE",
            desc: "For hobbyists & solo devs",
            features: [
              "3 Active Projects",
              "100 Runs/month",
              "Basic Node Types",
              "Community Support",
            ],
            btn: "Get Started",
          },
          pro: {
            title: "PRO",
            price: "$19",
            desc: "/ editor / month",
            features: [
              "Unlimited Projects",
              "AI Self-Healing Selectors",
              "Parallel Execution (x5)",
              "Email Support",
            ],
            btn: "Get Started",
          },
          team: {
            title: "TEAM",
            price: "$49",
            desc: "/ editor / month",
            features: [
              "Unlimited Runs",
              "Real-time Log Terminal",
              "Dedicated Slack Channel",
              "90-Day Data Retention",
            ],
            btn: "Get Started",
          },
        },
      },
      common: {
        back_home: "Back to Home",
        copied: "Copied!",
        copy_clipboard: "Copy to clipboard",
      },
    },
  },
  es: {
    translation: {
      hero: {
        title_part1: "hal",
        title_part2: "Test",
        subtitle: "Framework moderno de automatización visual.",
        headline_part1: "El Eslabón Perdido",
        headline_part2: "en la Automatización",
        desc1: "Creador de flujos sin código con auto-recuperación por IA",
        desc2: "y ejecución en tiempo real con Playwright.",
        zero_config: "Cero configuración. Sin clonar repositorio.",
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
      stats: {
        flows: "Flujos Ejecutados",
        nodes: "Tipos de Nodos",
        success: "Tasa de Éxito",
        source: "Código Abierto",
      },
      pricing: {
        title_part1: "Desbloquea tu",
        title_part2: "Máximo Potencial",
        subtitle: "Precios simples y escalables para equipos de todo tamaño.",
        enterprise_title: "¿Buscas soluciones empresariales?",
        enterprise_subtitle:
          "Despliegues a medida y acuerdos de nivel de servicio (SLA)",
        tiers: {
          starter: {
            title: "INICIAL",
            price: "GRATIS",
            desc: "Para entusiastas y creadores independientes",
            features: [
              "3 Proyectos Activos",
              "100 Ejecuciones/mes",
              "Tipos de Nodos Básicos",
              "Soporte de la Comunidad",
            ],
            btn: "Comenzar",
          },
          pro: {
            title: "PRO",
            price: "$19",
            desc: "/ editor / mes",
            features: [
              "Proyectos Ilimitados",
              "Selectores Auto-Recuperables IA",
              "Ejecución en Paralelo (x5)",
              "Soporte por Correo",
            ],
            btn: "Comenzar",
          },
          team: {
            title: "EQUIPO",
            price: "$49",
            desc: "/ editor / mes",
            features: [
              "Ejecuciones Ilimitadas",
              "Terminal de Registros en Tiempo Real",
              "Canal Exclusivo de Slack",
              "Retención de Datos por 90 Días",
            ],
            btn: "Comenzar",
          },
        },
      },
      common: {
        back_home: "Volver al Inicio",
        copied: "¡Copiado!",
        copy_clipboard: "Copiar al portapapeles",
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
