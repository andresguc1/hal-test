import React from "react";
import { useTranslation } from "react-i18next";
import { motion as Motion } from "framer-motion";
import { Check } from "lucide-react";

const PricingTier = ({
  title,
  price,
  description,
  features,
  buttonText,
  highlighted,
  color,
}) => {
  const { t } = useTranslation();
  return (
    <Motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      className={`relative p-8 rounded-3xl border ${
        highlighted
          ? `border-${color}-500 shadow-lg shadow-${color}-500/20`
          : "border-white/10 bg-white/5"
      } backdrop-blur-md flex flex-col items-center text-center`}
    >
      {highlighted && (
        <div
          className={`absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-${color}-500 text-[10px] font-bold uppercase tracking-widest`}
        >
          {t("pricing.most_popular", "Most Popular")}
        </div>
      )}

      <h3
        className={`text-xl font-bold tracking-widest mb-4 ${highlighted ? `text-${color}-400` : "text-white/70"}`}
      >
        {title}
      </h3>

      <div className="flex flex-col mb-2">
        <span className="text-5xl font-extrabold text-white">{price}</span>
        <span className="text-xs text-white/40 mt-1 uppercase tracking-widest">
          {description}
        </span>
      </div>

      <ul className="mt-8 mb-8 space-y-4 text-left w-full">
        {features.map((feature, index) => (
          <li
            key={index}
            className="flex items-center gap-3 text-sm text-slate-300"
          >
            <Check size={16} className={`text-${color}-500`} />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <button
        className={`mt-auto w-full py-3 rounded-full font-bold uppercase tracking-widest text-xs transition-all ${
          highlighted
            ? `bg-white text-black hover:bg-white/90 shadow-xl shadow-white/10`
            : "border border-white/20 hover:bg-white/10 text-white"
        }`}
      >
        {buttonText}
      </button>
    </Motion.div>
  );
};

export default function Pricing() {
  const { t } = useTranslation();
  const tiers = [
    {
      title: t("pricing.tiers.starter.title", "STARTER"),
      price: t("pricing.tiers.starter.price", "FREE"),
      description: t("pricing.tiers.starter.desc", "For hobbyists & solo devs"),
      features: [
        t("pricing.tiers.starter.features.0", "3 Active Projects"),
        t("pricing.tiers.starter.features.1", "100 Runs/month"),
        t("pricing.tiers.starter.features.2", "Basic Node Types"),
        t("pricing.tiers.starter.features.3", "Community Support"),
      ],
      buttonText: t("pricing.tiers.starter.btn", "Get Started"),
      highlighted: false,
      color: "apple-blue",
    },
    {
      title: t("pricing.tiers.pro.title", "PRO"),
      price: t("pricing.tiers.pro.price", "$19"),
      description: t("pricing.tiers.pro.desc", "/ editor / month"),
      features: [
        t("pricing.tiers.pro.features.0", "Unlimited Projects"),
        t("pricing.tiers.pro.features.1", "AI Self-Healing Selectors"),
        t("pricing.tiers.pro.features.2", "Parallel Execution (x5)"),
        t("pricing.tiers.pro.features.3", "Email Support"),
      ],
      buttonText: t("pricing.tiers.pro.btn", "Get Started"),
      highlighted: true,
      color: "apple-blue",
    },
    {
      title: t("pricing.tiers.team.title", "TEAM"),
      price: t("pricing.tiers.team.price", "$49"),
      description: t("pricing.tiers.team.desc", "/ editor / month"),
      features: [
        t("pricing.tiers.team.features.0", "Unlimited Runs"),
        t("pricing.tiers.team.features.1", "Real-time Log Terminal"),
        t("pricing.tiers.team.features.2", "Dedicated Slack Channel"),
        t("pricing.tiers.team.features.3", "90-Day Data Retention"),
      ],
      buttonText: t("pricing.tiers.team.btn", "Get Started"),
      highlighted: false,
      color: "hal-primary",
    },
  ];

  return (
    <div
      id="pricing"
      className="relative z-10 w-full max-w-6xl mx-auto px-4 py-12"
    >
      <div className="text-center mb-16">
        <Motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-bold uppercase tracking-tight mb-4"
        >
          {t("pricing.title_part1", "Unlock Your")}{" "}
          <span className="text-hal-primary-400">
            {t("pricing.title_part2", "Full Potential")}
          </span>
        </Motion.h2>
        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 font-mono text-sm tracking-widest"
        >
          {t(
            "pricing.subtitle",
            "Simple, scalable pricing for teams of all sizes.",
          )}
        </Motion.p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, index) => (
          <Motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <PricingTier {...tier} />
          </Motion.div>
        ))}
      </div>

      <Motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.5 }}
        className="mt-16 text-center"
      >
        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
          {t("pricing.enterprise_title", "Looking for enterprise solutions?")}
        </p>
        <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em] mt-1">
          {t("pricing.enterprise_subtitle", "Custom deployments & SLAs")}
        </p>
      </Motion.div>
    </div>
  );
}
