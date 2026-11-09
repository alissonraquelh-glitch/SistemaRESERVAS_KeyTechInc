import { useAuth } from "../../context/AuthContext";
import logoImg from "../../assets/logo.png";

export default function Header({ currentView, setCurrentView }) {
  const {
    isAuthenticated,
    setIsLoginModalOpen,
    logout,
  } = useAuth();

  const isClientView = currentView === "client";

  const handleClientViewClick = () => {
    setCurrentView("client");
  };

  const handleEmployeeViewClick = () => {
    if (!isAuthenticated) {
      setIsLoginModalOpen(true);
    } else {
      setCurrentView("employee");
    }
  };

  return (
    <header className="bg-bautista-dark/95 backdrop-blur-md text-white sticky top-0 z-50 shadow-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo y Branding */}
          <div
            className="flex items-center space-x-4 cursor-pointer group"
            onClick={handleClientViewClick}
          >
            <div className="w-16 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform p-1 overflow-hidden">
              <img
                src={logoImg}
                alt="Logo Taller Bautista"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/logo.png";
                }}
              />
            </div>
            <div className="hidden sm:block">
              <div className="font-black text-xl leading-tight tracking-tight text-white group-hover:text-gray-200 transition-colors">
                GRUPO BAUTISTA
              </div>
              <div className="text-[10px] text-red-400 font-bold tracking-widest uppercase">
                Servicios Automotrices
              </div>
            </div>
          </div>

            {/* Si está autenticado y en modo empleado, botón de logout */}
            {isAuthenticated && !isClientView && (
              <button
                type="button"
                onClick={logout}
                title="Cerrar sesión"
                className="w-10 h-10 rounded-xl bg-white/10 hover:bg-red-600/80 text-gray-300 hover:text-white flex items-center justify-center transition-colors text-sm"
              >
                <i
                  aria-hidden="true"
                  className="fa-solid fa-arrow-right-from-bracket"
                ></i>
              </button>
            )}
          </div>
        </div>
    </header>
  );
}
