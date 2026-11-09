import { useState } from "react";
import Modal from "../../components/ui/Modal";
import { useAuth } from "../../context/AuthContext";
export default function LoginModal() {
  const { isLoginModalOpen, setIsLoginModalOpen, login } = useAuth();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (await login(email, password)) setPassword("");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      isOpen={isLoginModalOpen}
      onClose={() => {
        if (!busy) setIsLoginModalOpen(false);
      }}
      title="Acceso de Personal Autorizado"
      subtitle="Ingrese sus credenciales para acceder al panel interno"
      maxWidth="max-w-md"
    >
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold">
          Correo electrónico
          <input
            required
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="block mt-1 w-full border p-3 rounded-xl"
          />
        </label>
        <label className="block text-sm font-bold">
          Contraseña
          <input
            required
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block mt-1 w-full border p-3 rounded-xl"
          />
        </label>
        <button
          disabled={busy}
          className="w-full p-3 rounded-xl bg-bautista-red text-white font-bold disabled:opacity-50"
        >
          {busy ? "Verificando…" : "Iniciar sesión"}
        </button>
      </form>
    </Modal>
  );
}
