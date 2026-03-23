import { Link, useLocation } from "react-router-dom";

const nav = [
  { to: "/", label: "Dashboard" },
  { to: "/sensores", label: "Sensores" },
  { to: "/atuadores", label: "Atuadores" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "#1e293b",
          color: "#f1f5f9",
          padding: "1.5rem 0",
        }}
      >
        <h2 style={{ padding: "0 1rem 1rem", fontSize: "1.1rem" }}>
          SCA
        </h2>
        <nav>
          {nav.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              style={{
                display: "block",
                padding: "0.5rem 1rem",
                color: location.pathname === to ? "#fff" : "#94a3b8",
                background: location.pathname === to ? "#334155" : "transparent",
                textDecoration: "none",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main style={{ flex: 1, padding: "1.5rem 2rem", background: "#f8fafc" }}>
        {children}
      </main>
    </div>
  );
}
