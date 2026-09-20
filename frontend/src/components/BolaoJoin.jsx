import { useState } from "react";

// Campo pra escolher o apelido e entrar no bolão.
export default function BolaoJoin({ onRegister, onDone }) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await onRegister(nickname.trim());
      onDone?.(data);
    } catch (err) {
      setError(err.message || "Não foi possível cadastrar o apelido.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Seu apelido (2 a 20 letras)"
          maxLength={20}
          required
        />
        <button type="submit" className="btn-primary text-sm" disabled={busy || nickname.trim().length < 2}>
          {busy ? "..." : "Entrar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </form>
  );
}
