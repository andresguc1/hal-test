import React from "react";
import { useTranslation } from "react-i18next";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { label: "Platform", href: "#platform" },
  { label: "Healing", href: "#healing" },
  { label: "Interop", href: "#interop" },
  {
    label: "Docs",
    href: "https://deepwiki.com/andresguc1/hal-test",
    external: true,
  },
  {
    label: "Roadmap",
    href: "https://github.com/users/andresguc1/projects/8",
    external: true,
  },
];

export default function Navbar() {
  const { t, i18n } = useTranslation();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith("es") ? "en" : "es";
    i18n.changeLanguage(newLang);
  };

  return (
    <nav className="fixed top-0 left-0 w-full p-6 z-50 flex justify-between items-center bg-slate-900/50 backdrop-blur-md border-b border-white/5">
      <Motion.a
        href="#top"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 cursor-pointer group no-underline"
      >
        <img
          src="/images/haltest_logo.jpeg"
          alt="HAL-TEST"
          className="w-8 h-8 rounded-md shadow-lg shadow-hal-primary-500/20 group-hover:scale-110 transition-transform"
        />
        <div className="text-xl font-bold tracking-widest flex gap-1">
          <span className="text-hal-primary-400">HAL</span>
          <span className="text-white/30">-</span>
          <span className="text-hal-warning-500">TEST</span>
        </div>
      </Motion.a>

      <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-widest text-slate-500"
      >
        {NAV_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className="hover:text-hal-primary-400 transition-colors no-underline text-slate-500"
          >
            {link.label}
          </a>
        ))}
      </Motion.div>

      <Motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex items-center gap-6"
      >
        <button
          onClick={toggleLanguage}
          className="text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors"
        >
          {i18n.language.startsWith("es") ? "EN" : "ES"}
        </button>
        <a
          href="/app"
          className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-hal-primary-500 hover:bg-hal-primary-400 text-white text-xs font-bold uppercase tracking-widest transition-colors no-underline"
        >
          {t("cta.launch_app") || "Launch App"}
        </a>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="md:hidden text-white/70 hover:text-white transition-colors"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </Motion.div>

      <AnimatePresence>
        {menuOpen && (
          <Motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden absolute top-full left-0 w-full bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex flex-col p-6 gap-4"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                onClick={() => setMenuOpen(false)}
                className="text-sm font-bold uppercase tracking-widest text-slate-300 hover:text-hal-primary-400 transition-colors no-underline"
              >
                {link.label}
              </a>
            ))}
            <a
              href="/app"
              onClick={() => setMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-hal-primary-500 hover:bg-hal-primary-400 text-white text-xs font-bold uppercase tracking-widest transition-colors no-underline"
            >
              {t("cta.launch_app") || "Launch App"}
            </a>
          </Motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
