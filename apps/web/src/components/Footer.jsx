import React from "react";

const LINK_GROUPS = [
  {
    title: "Product",
    links: [
      { label: "Platform", href: "#platform" },
      { label: "Auto-healing", href: "#healing" },
      { label: "Interoperability", href: "#interop" },
      { label: "Launch App", href: "/app" },
    ],
  },
  {
    title: "Resources",
    links: [
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
      {
        label: "GitHub",
        href: "https://github.com/andresguc1/hal-test",
        external: true,
      },
    ],
  },
  {
    title: "Community",
    links: [
      {
        label: "Slack",
        href: "https://join.slack.com/t/haltest-talk/shared_invite/zt-3tzii9nxh-vgdIcI5A8bg~GCG8QF6MuA",
        external: true,
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/5 bg-slate-900/60 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-10">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <img
              src="/images/haltest_logo.jpeg"
              alt="HAL-TEST"
              className="w-8 h-8 rounded-md"
            />
            <div className="text-lg font-bold tracking-widest flex gap-1">
              <span className="text-hal-primary-400">HAL</span>
              <span className="text-white/30">-</span>
              <span className="text-hal-warning-500">TEST</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
            The visual QA platform for automation, performance and security —
            built on Playwright.
          </p>
        </div>

        {LINK_GROUPS.map((group) => (
          <div key={group.title}>
            <h4 className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold mb-4">
              {group.title}
            </h4>
            <ul className="space-y-3">
              {group.links.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className="text-sm text-slate-400 hover:text-white transition-colors no-underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] uppercase tracking-widest text-slate-600">
            © {new Date().getFullYear()} Haltest
          </span>
          <span className="text-[11px] uppercase tracking-widest text-slate-600">
            The Missing Link in Browser Automation
          </span>
        </div>
      </div>
    </footer>
  );
}
