import React from "react";
import { useAuth } from "../../context/AuthContext";
import { ROLES, canAccessView, ROLE_LABELS } from "../../adapters/authAdapter";
import SecretaryView from "../appointments/SecretaryView";
import WorkshopView from "../workshop/WorkshopView";
import AdminView from "../administration/AdminView";

export default function StaffPortal() {
  const { currentUser, activeInternalView, switchInternalView } = useAuth();

  const userRole = currentUser?.role || ROLES.SECRETARIA;

  return (
    <div className="bg-gray-50 min-h-screen pb-20 fade-in">
      {/* Barra Superior del Portal de Personal */}
      <div className="bg-white border-b border-gray-200 sticky top-20 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Identificación del Empleado */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gray-900 text-white flex items-center justify-center font-black text-sm shadow-md">
              <i aria-hidden="true" className="fa-solid fa-user-shield"></i>
            </div>
            <div>
              <div className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                {currentUser?.name || "Personal Autorizado"}
              </div>
            </div>
          </div>

          {/* Navegación por Pestañas según RBAC */}
          <div className="flex items-center bg-gray-100 p-1 rounded-2xl border border-gray-200 overflow-x-auto max-w-full">
            {/* Secretaría: visible para admin y secretaria */}
            {canAccessView(userRole, ROLES.SECRETARIA) && (
              <button
                type="button"
                onClick={() => switchInternalView(ROLES.SECRETARIA)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                  activeInternalView === ROLES.SECRETARIA
                    ? "bg-bautista-red text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
                }`}
              >
                <i
                  aria-hidden="true"
                  className="fa-solid fa-clipboard-list"
                ></i>
                <span>Secretaría</span>
              </button>
            )}

            {/* Jefe de Taller: visible para todos (admin, secretaria y jefe) */}
            {canAccessView(userRole, ROLES.JEFE) && (
              <button
                type="button"
                onClick={() => switchInternalView(ROLES.JEFE)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                  activeInternalView === ROLES.JEFE
                    ? "bg-bautista-red text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
                }`}
              >
                <i aria-hidden="true" className="fa-solid fa-wrench"></i>
                <span>Jefe de Taller</span>
              </button>
            )}

            {/* Administración: visible para admin y secretaria */}
            {canAccessView(userRole, ROLES.ADMIN) && (
              <button
                type="button"
                onClick={() => switchInternalView(ROLES.ADMIN)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 flex items-center gap-2 whitespace-nowrap ${
                  activeInternalView === ROLES.ADMIN
                    ? "bg-bautista-red text-white shadow-md"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-200/70"
                }`}
              >
                <i aria-hidden="true" className="fa-solid fa-gear"></i>
                <span>Administración</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenido de la Vista Activa */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeInternalView === ROLES.SECRETARIA && <SecretaryView />}
        {activeInternalView === ROLES.JEFE && <WorkshopView />}
        {activeInternalView === ROLES.ADMIN && <AdminView />}
      </main>
    </div>
  );
}
