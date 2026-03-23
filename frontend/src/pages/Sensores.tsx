import { useEffect, useState } from "react";

interface Sensor {
  id_sensor: number;
  nome: string;
  tipo_sensor: string;
  localizacao: string;
  estado: string;
  data_instalacao: string | null;
}

const apiBase = import.meta.env.VITE_API_URL ?? "";

export function Sensores() {
  const [sensores, setSensores] = useState<Sensor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = apiBase ? `${apiBase}/api/sensores` : "/api/sensores";
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then((data) => {
        setSensores(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>A carregar sensores…</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Erro: {error}</p>;
  if (sensores.length === 0) return <p>Nenhum sensor registado. Execute o schema na base de dados.</p>;

  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Sensores</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th style={{ padding: "0.75rem 1rem" }}>ID</th>
            <th style={{ padding: "0.75rem 1rem" }}>Nome</th>
            <th style={{ padding: "0.75rem 1rem" }}>Tipo</th>
            <th style={{ padding: "0.75rem 1rem" }}>Localização</th>
            <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
            <th style={{ padding: "0.75rem 1rem" }}>Data instalação</th>
          </tr>
        </thead>
        <tbody>
          {sensores.map((s) => (
            <tr key={s.id_sensor} style={{ borderTop: "1px solid #e2e8f0" }}>
              <td style={{ padding: "0.75rem 1rem" }}>{s.id_sensor}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{s.nome}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{s.tipo_sensor}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{s.localizacao}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{s.estado}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{s.data_instalacao ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
