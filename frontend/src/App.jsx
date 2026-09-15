import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import { useAuth } from "./context/AuthContext.jsx";

import Home from "./pages/Home.jsx";
import Standings from "./pages/Standings.jsx";
import Matches from "./pages/Matches.jsx";
import MatchDetail from "./pages/MatchDetail.jsx";
import Teams from "./pages/Teams.jsx";
import TeamDetail from "./pages/TeamDetail.jsx";
import Scorers from "./pages/Scorers.jsx";
import Login from "./pages/Login.jsx";
import Admin from "./pages/Admin.jsx";

function Private({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tabela" element={<Standings />} />
        <Route path="/jogos" element={<Matches />} />
        <Route path="/jogos/:id" element={<MatchDetail />} />
        <Route path="/times" element={<Teams />} />
        <Route path="/times/:id" element={<TeamDetail />} />
        <Route path="/artilharia" element={<Scorers />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Private><Admin /></Private>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
