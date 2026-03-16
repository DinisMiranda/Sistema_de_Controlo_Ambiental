import { Link } from "react-router-dom";

export function Dashboard() {
  return (
    <div>
      <h1 style={{ marginBottom: "0.5rem" }}>Sistema de Controlo Ambiental</h1>
      <p style={{ color: "#64748b", marginBottom: "2rem" }}>
        Monitorização e controlo de sensores, atuadores e alertas.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <Link
          to="/sensores"
          style={{
            padding: "1rem 1.5rem",
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            color: "#1e293b",
            textDecoration: "none",
          }}
        >
          Sensores
        </Link>
        <Link
          to="/atuadores"
          style={{
            padding: "1rem 1.5rem",
            background: "#fff",
            borderRadius: 8,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            color: "#1e293b",
            textDecoration: "none",
          }}
        >
          Atuadores
        </Link>
      </div>
    </div>
  );
}
