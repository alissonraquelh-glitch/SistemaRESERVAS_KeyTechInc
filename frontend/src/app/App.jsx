import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import ClientPortal from "../features/public-booking/ClientPortal";
import StaffPortal from "../features/staff/StaffPortal";
import LoginModal from "../features/auth/LoginModal";
import { useAuth } from "../context/AuthContext";
export default function App() {
  const location = useLocation(),
    navigate = useNavigate();
  const { isAuthenticated, initializing, sessionError, setIsLoginModalOpen } =
    useAuth();
  const internal = location.pathname === "/personal";
  useEffect(() => {
    if (internal && !initializing && !isAuthenticated) {
      navigate("/", { replace: true });
      setIsLoginModalOpen(true);
    }
  }, [internal, initializing, isAuthenticated, navigate, setIsLoginModalOpen]);
  const switchView = (view) => {
    if (view === "employee" && !isAuthenticated) setIsLoginModalOpen(true);
    else navigate(view === "employee" ? "/personal" : "/");
  };
  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header
        currentView={internal ? "employee" : "client"}
        setCurrentView={switchView}
      />
      {sessionError && (
        <p role="alert" className="p-3 text-center bg-amber-50 text-amber-900">
          No se pudo recuperar la sesión: {sessionError}
        </p>
      )}
      <main className="flex-1">
        {internal ? (
          initializing ? (
            <p role="status" className="p-8">
              Verificando sesión…
            </p>
          ) : isAuthenticated ? (
            <StaffPortal />
          ) : null
        ) : (
          <ClientPortal />
        )}
      </main>
      <Footer onSwitchToEmployee={() => switchView("employee")} />
      <LoginModal />
    </div>
  );
}
