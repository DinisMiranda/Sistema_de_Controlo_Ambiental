import { useEffect, useState } from "react";

interface Atuador {
  id_atuador: number;
  nome: string;
  tipo_atuador: string;
  localizacao: string;
  estado: string;
}

const apiBase = import.meta.env.VITE_API_URL ?? "";

export function Atuadores() {
  const [atuadores, setAtuadores] = useState<Atuador[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const url = apiBase ? `${apiBase}/api/atuadores` : "/api/atuadores";
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Erro ao carregar"))))
      .then((data) => {
        setAtuadores(data);
        setError(null);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>A carregar atuadores…</p>;
  if (error) return <p style={{ color: "#b91c1c" }}>Erro: {error}</p>;
  if (atuadores.length === 0) return <p>Nenhum atuador registado. Execute o schema na base de dados.</p>;

  return (
    <div>
      <h1 style={{ marginBottom: "1rem" }}>Atuadores</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 8, overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
        <thead>
          <tr style={{ background: "#f1f5f9", textAlign: "left" }}>
            <th style={{ padding: "0.75rem 1rem" }}>ID</th>
            <th style={{ padding: "0.75rem 1rem" }}>Nome</th>
            <th style={{ padding: "0.75rem 1rem" }}>Tipo</th>
            <th style={{ padding: "0.75rem 1rem" }}>Localização</th>
            <th style={{ padding: "0.75rem 1rem" }}>Estado</th>
          </tr>
        </thead>
        <tbody>
          {atuadores.map((a) => (
            <tr key={a.id_atuador} style={{ borderTop: "1px solid #e2e8f0" }}>
              <td style={{ padding: "0.75rem 1rem" }}>{a.id_atuador}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{a.nome}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{a.tipo_atuador}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{a.localizacao}</td>
              <td style={{ padding: "0.75rem 1rem" }}>{a.estado}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
