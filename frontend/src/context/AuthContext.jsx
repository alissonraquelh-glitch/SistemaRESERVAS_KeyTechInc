import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { ROLES, canAccessView } from "../adapters/authAdapter";
import { apiRequest, setCsrfToken } from "../services/api/client";
import { API_ROUTES as R } from "../services/api/routes";
import { useToast } from "./ToastContext";
const AuthContext = createContext(null);
const mapUser = (u) => ({
  id: u.id_usuario,
  email: u.correo,
  name: u.nombre_completo,
  role: {
    ADMIN: "admin",
    DUENO: "admin",
    SECRETARIA: "secretaria",
    JEFE_TALLER: "jefe",
  }[u.rol],
});
export function AuthProvider({ children }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null),
    [initializing, setInitializing] = useState(true),
    [sessionError, setSessionError] = useState(null);
  const [activeInternalView, setActiveInternalView] = useState(
      ROLES.SECRETARIA,
    ),
    [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const accept = useCallback((data) => {
    const user = mapUser(data.usuario);
    setCsrfToken(data.csrf);
    setCurrentUser(user);
    setActiveInternalView(user.role);
  }, []);
  useEffect(() => {
    const c = new AbortController();
    apiRequest(R.AUTH_ME, { signal: c.signal })
      .then((r) => accept(r.data))
      .catch((e) => {
        if (e.name !== "AbortError" && e.status !== 401)
          setSessionError(e.message);
      })
      .finally(() => {
        if (!c.signal.aborted) setInitializing(false);
      });
    return () => c.abort();
  }, [accept]);
  useEffect(() => {
    const clear = () => {
      setCurrentUser(null);
      setCsrfToken("");
    };
    window.addEventListener("bookit:unauthorized", clear);
    return () => window.removeEventListener("bookit:unauthorized", clear);
  }, []);
  const login = useCallback(
    async (email, password) => {
      try {
        const r = await apiRequest(R.AUTH_LOGIN, {
          body: { correo: email.trim(), password },
        });
        accept(r.data);
        setSessionError(null);
        setIsLoginModalOpen(false);
        navigate("/personal");
        return true;
      } catch (e) {
        showToast(e.message, "error");
        return false;
      }
    },
    [accept, navigate, showToast],
  );
  const logout = useCallback(async () => {
    try {
      await apiRequest(R.AUTH_LOGOUT);
      setCurrentUser(null);
      setCsrfToken("");
      navigate("/");
      showToast("Sesión cerrada.", "info");
    } catch (e) {
      showToast(e.message, "error");
    }
  }, [navigate, showToast]);
  const switchInternalView = useCallback(
    (view) => {
      if (canAccessView(currentUser?.role, view)) setActiveInternalView(view);
    },
    [currentUser],
  );
  return (
    <AuthContext.Provider
      value={{
        currentUser,
        initializing,
        sessionError,
        isAuthenticated: !!currentUser,
        activeInternalView,
        isLoginModalOpen,
        setIsLoginModalOpen,
        login,
        logout,
        switchInternalView,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  return useContext(AuthContext);
}
