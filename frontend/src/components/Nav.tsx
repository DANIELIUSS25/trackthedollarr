import { NavLink } from "react-router-dom";

interface NavSection {
  title: string;
  items: { to: string; label: string }[];
}

const sections: NavSection[] = [
  {
    title: "Platform",
    items: [{ to: "/dashboard", label: "Overview" }],
  },
  {
    title: "Market Intelligence",
    items: [
      { to: "/dollar-strength", label: "Dollar Strength" },
      { to: "/debt", label: "National Debt" },
      { to: "/inflation", label: "Inflation" },
      { to: "/rates", label: "Interest Rates" },
      { to: "/money-supply", label: "Money Supply" },
      { to: "/defense-spending", label: "Defense Spending" },
      { to: "/foreign-assistance", label: "Foreign Assistance" },
    ],
  },
  {
    title: "Derived Proxies",
    items: [
      { to: "/monetary-expansion-proxy", label: "Monetary Expansion" },
      { to: "/war-spending-proxy", label: "War Spending" },
    ],
  },
  {
    title: "Transparency",
    items: [
      { to: "/methodology", label: "Methodology" },
      { to: "/source-health", label: "Source Health" },
    ],
  },
];

export function Nav() {
  return (
    <nav className="flex flex-col gap-0.5 px-3 py-5">
      {sections.map((section, idx) => (
        <div key={section.title} className={idx > 0 ? "mt-5" : ""}>
          <h3 className="mb-2 px-3 section-label">{section.title}</h3>
          {section.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "nav-link-active" : ""}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  );
}
