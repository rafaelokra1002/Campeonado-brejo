import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) { navigate("/admin", { replace: true }); return null; }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Falha no login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto pt-8 animate-fade-in">
      <div className="text-center mb-6">
        <img src="/logo-192.png" alt="Campeonato Brejolandense" className="w-16 h-16 mx-auto mb-3 object-contain rounded-xl" />
        <h1 className="text-2xl font-black">Painel Administrativo</h1>
        <p className="text-sm text-gray-400">Entre para gerenciar o campeonato</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-2.5">{error}</div>}
        <div>
          <label className="label">E-mail</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@brejolandense.com" required autoFocus />
        </div>
        <div>
          <label className="label">Senha</label>
          <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p className="text-center text-xs text-gray-600 mt-4">
        Credenciais padrão (seed): <br />
        <code className="text-gray-400">admin@brejolandense.com</code> / <code className="text-gray-400">admin123</code>
      </p>
    </div>
  );
}
