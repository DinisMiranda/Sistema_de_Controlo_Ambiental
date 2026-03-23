import { Routes, Route, Link } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Sensores } from "./pages/Sensores";
import { Atuadores } from "./pages/Atuadores";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sensores" element={<Sensores />} />
        <Route path="/atuadores" element={<Atuadores />} />
      </Routes>
    </Layout>
  );
}

export default App;
