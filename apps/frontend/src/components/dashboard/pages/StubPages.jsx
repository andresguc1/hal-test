import React from "react";
import {
  BarChart2,
  ArrowRight,
  Sparkles,
  Settings,
  ExternalLink,
} from "lucide-react";

function StubPage({ icon, title, description, cta, onCta }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 400,
        gap: 16,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "var(--dash-accent-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--dash-accent)",
        }}
      >
        {icon}
      </div>
      <div>
        <h3
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--dash-text-primary)",
            margin: "0 0 6px",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            maxWidth: 320,
            margin: "0 auto",
          }}
        >
          {description}
        </p>
      </div>
      {cta && onCta && (
        <button className="dash-btn dash-btn-primary" onClick={onCta}>
          {cta} <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export function ReportsPage({ onViewReport }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--dash-text-primary)",
            margin: "0 0 4px",
          }}
        >
          Reports
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            margin: 0,
          }}
        >
          Detailed execution reports and analytics
        </p>
      </div>
      <StubPage
        icon={<BarChart2 size={28} />}
        title="Advanced Reports"
        description="Select a run from the Runs or History page to view its full report, including screenshots, logs, and step-by-step breakdown."
        cta="View Runs"
        onCta={() => onViewReport?.()}
      />
    </div>
  );
}

export function AIPage({ onOpenSettings }) {
  const cards = [
    {
      icon: <Sparkles size={20} />,
      title: "AI Provider",
      desc: "Configure Ollama, OpenAI, Anthropic, or Google AI for flow generation and healing",
      badge: "Active",
      onClick: () => onOpenSettings?.("integrations"),
    },
    {
      icon: <Settings size={20} />,
      title: "Fine-Tuning",
      desc: "Train custom models using your execution history as JSONL datasets",
    },
    {
      icon: <ExternalLink size={20} />,
      title: "CI/CD Integration",
      desc: "Connect HalTest to your GitHub Actions, GitLab CI, or Jenkins pipeline",
      badge: "Coming Soon",
    },
    {
      icon: <BarChart2 size={20} />,
      title: "Webhooks",
      desc: "Receive notifications when runs complete, fail, or trigger events",
      badge: "Coming Soon",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--dash-text-primary)",
            margin: "0 0 4px",
          }}
        >
          AI & Integrations
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            margin: 0,
          }}
        >
          Configure AI providers, models, and external integrations
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 14,
        }}
      >
        {cards
          .filter((card) => card.onClick)
          .map(({ icon, title, desc, badge, onClick }) => (
          <div
            key={title}
            onClick={onClick}
            style={{
              background: "var(--dash-surface)",
              border: "1px solid var(--dash-border)",
              borderRadius: 12,
              padding: 20,
              boxShadow: "var(--dash-shadow-card)",
              cursor: onClick ? "pointer" : "default",
              transition: "all 0.2s ease",
            }}
            className={
              onClick
                ? "hover:border-blue-500/50 hover:bg-slate-800/20 active:scale-[0.98]"
                : ""
            }
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 8,
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 9,
                  background: "var(--dash-accent-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--dash-accent)",
                  flexShrink: 0,
                }}
              >
                {icon}
              </div>
              {badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: 9999,
                    background:
                      badge === "Active"
                        ? "var(--dash-success-subtle)"
                        : "var(--dash-surface-hover)",
                    color:
                      badge === "Active"
                        ? "var(--dash-success-text)"
                        : "var(--dash-text-tertiary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    border: `1px solid ${badge === "Active" ? "var(--dash-success)" : "var(--dash-border)"}`,
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 14,
                color: "var(--dash-text-primary)",
                marginBottom: 4,
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--dash-text-secondary)",
                lineHeight: 1.5,
              }}
            >
              {desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SettingsPageDash({ onOpenSettings }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2
          style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: "var(--dash-text-primary)",
            margin: "0 0 4px",
          }}
        >
          Settings
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "var(--dash-text-secondary)",
            margin: 0,
          }}
        >
          Application settings and preferences
        </p>
      </div>
      <StubPage
        icon={<Settings size={28} />}
        title="Application Settings"
        description="Access the full settings panel to configure browser options, execution settings, API keys, and appearance."
        cta="Open Settings"
        onCta={onOpenSettings}
      />
    </div>
  );
}
